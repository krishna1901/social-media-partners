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

  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: `${baseName}'s Workspace`, owner_id: user.id, plan: "pro" })
    .select("id")
    .single();
  if (wsError || !ws) return null;

  await supabase
    .from("workspace_members")
    .insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });

  await supabase
    .from("settings")
    .insert({ workspace_id: ws.id, brand_name: `${baseName}'s Workspace`, timezone: "UTC" });

  return ws.id;
}

/** Workspaces the current user belongs to. */
export async function listWorkspaces(supabase: SupabaseClient): Promise<Workspace[]> {
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as Workspace[]) ?? [];
}
