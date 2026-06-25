import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { Workspace } from "@/lib/db/types";

/** The current user's active workspace id (their earliest membership), or null. */
export async function getActiveWorkspaceId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

/**
 * Ensures the user has a profile, a default workspace, an owner membership, and
 * a settings row. Idempotent — safe to call on every login. Returns the active
 * workspace id (or null on failure).
 */
export async function ensureUserBootstrapped(
  supabase: SupabaseClient,
  user: User
): Promise<string | null> {
  // Profile is auto-created by the DB trigger, but upsert defensively.
  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ?? user.email ?? null,
      },
      { onConflict: "id" }
    );

  const existing = await getActiveWorkspaceId(supabase, user.id);
  if (existing) return existing;

  const baseName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "My";

  // Generate the id app-side and insert WITHOUT a RETURNING select: the creator
  // is not a member yet, so the `workspaces_select_member` RLS policy would
  // filter the returned row and abort bootstrap. The INSERT itself passes its
  // `with_check (owner_id = auth.uid())`. New workspaces start on the free
  // Starter plan; Pro/Agency require a real Stripe subscription (webhook-driven).
  const workspaceId = crypto.randomUUID();
  const { error: wsError } = await supabase
    .from("workspaces")
    .insert({ id: workspaceId, name: `${baseName}'s Workspace`, owner_id: user.id, plan: "starter" });
  if (wsError) {
    // A concurrent bootstrap won the race (owner-unique index `uq_workspaces_owner`
    // violation). Re-read and return the workspace that actually landed, so
    // parallel first-login requests collapse onto one workspace instead of
    // each creating their own.
    const winner = await getActiveWorkspaceId(supabase, user.id);
    if (winner) return winner;
    await new Promise((r) => setTimeout(r, 50));
    return getActiveWorkspaceId(supabase, user.id);
  }

  // Owner membership must be created before settings (settings RLS requires
  // workspace membership). Tolerate a concurrent winner here too.
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: user.id, role: "owner" });
  if (memberError) {
    const winner = await getActiveWorkspaceId(supabase, user.id);
    return winner ?? null;
  }

  // Settings is idempotent via the workspace_id unique constraint.
  await supabase
    .from("settings")
    .upsert(
      { workspace_id: workspaceId, brand_name: `${baseName}'s Workspace`, timezone: "UTC" },
      { onConflict: "workspace_id", ignoreDuplicates: true }
    );

  return workspaceId;
}

/** Workspaces the current user belongs to. */
export async function listWorkspaces(supabase: SupabaseClient): Promise<Workspace[]> {
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as Workspace[]) ?? [];
}
