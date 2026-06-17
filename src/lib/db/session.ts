import "server-only";
import { getDbContext, isLive } from "@/lib/db/context";

/**
 * Minimal real-account view for the app shell (sidebar/header) and dashboard.
 * Live → the active workspace + the signed-in user's profile; demo → all null so
 * components fall back to demo constants.
 */
export interface SessionView {
  live: boolean;
  workspaceName: string | null;
  plan: string | null;
  userName: string | null;
  userEmail: string | null;
}

export async function getSessionView(): Promise<SessionView> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return { live: false, workspaceName: null, plan: null, userName: null, userEmail: null };
  }

  const [wsRes, profileRes] = await Promise.all([
    ctx.supabase.from("workspaces").select("name, plan").eq("id", ctx.workspaceId).maybeSingle(),
    ctx.supabase.from("profiles").select("full_name, email").eq("id", ctx.userId).maybeSingle(),
  ]);

  const email = (profileRes.data?.email as string | null) ?? null;
  const fullName = (profileRes.data?.full_name as string | null) ?? null;

  return {
    live: true,
    workspaceName: (wsRes.data?.name as string | null) ?? null,
    plan: (wsRes.data?.plan as string | null) ?? null,
    userName: fullName ?? (email ? email.split("@")[0] : null),
    userEmail: email,
  };
}
