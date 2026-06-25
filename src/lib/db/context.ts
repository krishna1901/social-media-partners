import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getActiveWorkspaceId, ensureUserBootstrapped } from "@/lib/db/workspaces";

export interface DbContext {
  /** Real Supabase env present. */
  configured: boolean;
  supabase: SupabaseClient | null;
  userId: string | null;
  workspaceId: string | null;
}

/** Live = configured + authenticated + scoped to a workspace. */
export type LiveDbContext = DbContext & {
  supabase: SupabaseClient;
  userId: string;
  workspaceId: string;
};

/**
 * Resolves the per-request data context. In demo/preview mode (no real env) or
 * when there's no authenticated user/workspace, `configured`/`workspaceId` are
 * false/null and callers fall back to demo data.
 */
export async function getDbContext(): Promise<DbContext> {
  if (!isSupabaseConfigured()) {
    return { configured: false, supabase: null, userId: null, workspaceId: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, supabase, userId: null, workspaceId: null };
  // Resolve the active workspace; if the user has none yet (e.g. signed up via
  // the email-confirm flow, which skips bootstrap), create it now. Idempotent —
  // self-heals any authenticated user who is missing a workspace.
  let workspaceId = await getActiveWorkspaceId(supabase, user.id);
  if (!workspaceId) {
    workspaceId = await ensureUserBootstrapped(supabase, user);
  }
  return { configured: true, supabase, userId: user.id, workspaceId };
}

export function isLive(ctx: DbContext): ctx is LiveDbContext {
  return Boolean(ctx.configured && ctx.supabase && ctx.userId && ctx.workspaceId);
}

/**
 * Convenience for server actions that must be authenticated. Throws otherwise.
 * Also rejects suspended accounts so suspension is enforced for every server
 * action / API route (not just the (app) layout redirect, which doesn't run for
 * server actions or route handlers).
 */
export async function requireLiveContext(): Promise<LiveDbContext> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    throw new Error("Not authenticated or Supabase is not configured.");
  }
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("status")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (profile?.status === "suspended") {
    throw new Error("Account suspended.");
  }
  return ctx;
}
