"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit";
import { encryptSecret, decryptSecret, isEncryptionConfigured } from "@/lib/security/crypto";
import { PLAN_ORDER, type PlanId } from "@/lib/billing/plans";
import { IMP_ADMIN_COOKIE, IMP_ACTIVE_COOKIE } from "@/lib/admin/impersonation";
import { setPlatformSecret, clearPlatformSecret } from "@/lib/platform/secrets";
import { isKnownSecretKey, isSecretKey } from "@/lib/platform/catalog";

interface AdminActionResult {
  ok: boolean;
  error?: string;
}

const ROLES = ["member", "admin", "super_admin"] as const;
type Role = (typeof ROLES)[number];

export async function setUserRoleAction(userId: string, role: Role): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (!ROLES.includes(role)) return { ok: false, error: "Invalid role." };
  if (userId === admin.userId && role !== "super_admin") {
    return { ok: false, error: "You cannot remove your own super-admin role." };
  }
  const sb = createAdminClient();
  if (!sb) return { ok: false, error: "Admin backend not configured." };

  const { error } = await sb.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "set_user_role", targetType: "user", targetId: userId, metadata: { role } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function setUserStatusAction(userId: string, status: "active" | "suspended"): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (userId === admin.userId) return { ok: false, error: "You cannot suspend your own account." };
  const sb = createAdminClient();
  if (!sb) return { ok: false, error: "Admin backend not configured." };

  const { error } = await sb.from("profiles").update({ status }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: status === "suspended" ? "suspend_user" : "reactivate_user", targetType: "user", targetId: userId });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (userId === admin.userId) return { ok: false, error: "You cannot delete your own account." };
  const sb = createAdminClient();
  if (!sb) return { ok: false, error: "Admin backend not configured." };

  const { error } = await sb.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "delete_user", targetType: "user", targetId: userId });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setWorkspacePlanAction(workspaceId: string, plan: PlanId): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (!PLAN_ORDER.includes(plan)) return { ok: false, error: "Invalid plan." };
  const sb = createAdminClient();
  if (!sb) return { ok: false, error: "Admin backend not configured." };

  const { error } = await sb.from("workspaces").update({ plan }).eq("id", workspaceId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "set_workspace_plan", targetType: "workspace", targetId: workspaceId, metadata: { plan } });
  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  return { ok: true };
}

export async function deleteWorkspaceAction(workspaceId: string): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  const sb = createAdminClient();
  if (!sb) return { ok: false, error: "Admin backend not configured." };

  const { error } = await sb.from("workspaces").delete().eq("id", workspaceId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "delete_workspace", targetType: "workspace", targetId: workspaceId });
  revalidatePath("/admin/workspaces");
  return { ok: true };
}

/**
 * Start impersonating a user. Saves the admin's session (encrypted) so it can be
 * restored, then swaps the browser session to the target via a magic-link OTP.
 */
export async function impersonateUserAction(userId: string): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (userId === admin.userId) return { ok: false, error: "You're already this account." };
  if (!isEncryptionConfigured()) return { ok: false, error: "Set TOKEN_ENCRYPTION_KEY to enable impersonation." };

  const sb = createAdminClient();
  if (!sb) return { ok: false, error: "Admin backend not configured." };

  const { data: target } = await sb.from("profiles").select("email").eq("id", userId).maybeSingle();
  const email = (target as { email: string | null } | null)?.email;
  if (!email) return { ok: false, error: "That user has no email to impersonate." };

  const userClient = await createClient();
  const {
    data: { session },
  } = await userClient.auth.getSession();
  if (!session) return { ok: false, error: "No active admin session." };

  const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) return { ok: false, error: linkErr?.message ?? "Could not start impersonation." };

  const encryptedAdmin = encryptSecret(
    JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token })
  );

  const { error: otpErr } = await userClient.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (otpErr) return { ok: false, error: otpErr.message };

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(IMP_ADMIN_COOKIE, encryptedAdmin, { httpOnly: true, secure, sameSite: "lax", path: "/" });
  jar.set(IMP_ACTIVE_COOKIE, userId, { httpOnly: true, secure, sameSite: "lax", path: "/" });

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "impersonate_start", targetType: "user", targetId: userId });
  redirect("/dashboard");
}

/** Stop impersonating: restore the admin session and clear the markers. */
export async function stopImpersonationAction(): Promise<void> {
  const jar = await cookies();
  const enc = jar.get(IMP_ADMIN_COOKIE)?.value;
  // No impersonation in progress for this caller: nothing to restore. Clear any
  // stray marker and return without swapping the session or routing into admin.
  if (!enc) {
    jar.delete(IMP_ACTIVE_COOKIE);
    return;
  }
  let restored = false;
  try {
    const tokens = JSON.parse(decryptSecret(enc)) as { access_token: string; refresh_token: string };
    const userClient = await createClient();
    await userClient.auth.setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
    restored = true;
  } catch {
    // fall through — markers are cleared regardless
  }
  jar.delete(IMP_ADMIN_COOKIE);
  jar.delete(IMP_ACTIVE_COOKIE);
  // redirect() throws to navigate, so keep it outside the try/catch. Only route
  // into the admin area after a successful restore (it gates on requireSuperAdmin).
  if (restored) redirect("/admin/users");
}

export async function setPlatformSecretAction(key: string, value: string): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (!isKnownSecretKey(key)) return { ok: false, error: "Unknown key." };
  const v = value.trim();
  if (!v) return { ok: false, error: "Value is required." };

  const r = await setPlatformSecret(key, v, { isSecret: isSecretKey(key), updatedBy: admin.userId });
  if (!r.ok) return r;

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "set_platform_secret", targetType: "secret", targetId: key });
  revalidatePath("/admin/secrets");
  return { ok: true };
}

export async function clearPlatformSecretAction(key: string): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  if (!isKnownSecretKey(key)) return { ok: false, error: "Unknown key." };

  const r = await clearPlatformSecret(key);
  if (!r.ok) return r;

  await logAdminAction({ actorId: admin.userId, actorEmail: admin.email, action: "clear_platform_secret", targetType: "secret", targetId: key });
  revalidatePath("/admin/secrets");
  return { ok: true };
}
