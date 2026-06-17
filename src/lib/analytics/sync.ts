import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireLiveContext } from "@/lib/db/context";
import { getDecryptedToken } from "@/lib/db/social-tokens";

/**
 * Phase 3E — analytics sync.
 *
 * Pulls account-level metrics from connected platforms into
 * `analytics_snapshots` (one row per platform per run, `post_id` null). Uses the
 * stored, decrypted token via the provided client — service-role (cron) or
 * session (manual). Demo/preview is a no-op (no connections → nothing synced).
 *
 * LinkedIn member analytics aren't broadly available via the public API, so this
 * syncs Meta surfaces (Facebook Page + Instagram Business) for now.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export interface SyncSummary {
  ok: boolean;
  mode: "live" | "demo";
  synced: number;
  platforms: string[];
  message?: string;
}

interface Snapshot {
  followers: number;
  metrics: Record<string, unknown>;
}

async function fetchFacebookPageSnapshot(pageId: string, token: string): Promise<Snapshot | null> {
  const params = new URLSearchParams({
    fields: "followers_count,fan_count,name",
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/${pageId}?${params.toString()}`);
  if (!res.ok) return null;
  const d = (await res.json()) as { followers_count?: number; fan_count?: number };
  return { followers: d.followers_count ?? d.fan_count ?? 0, metrics: d as Record<string, unknown> };
}

async function fetchInstagramSnapshot(igId: string, token: string): Promise<Snapshot | null> {
  const params = new URLSearchParams({
    fields: "followers_count,media_count,username",
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/${igId}?${params.toString()}`);
  if (!res.ok) return null;
  const d = (await res.json()) as { followers_count?: number };
  return { followers: d.followers_count ?? 0, metrics: d as Record<string, unknown> };
}

/** Sync one workspace's connected platforms. Returns synced platform ids. */
export async function syncWorkspaceAnalytics(
  client: SupabaseClient,
  workspaceId: string
): Promise<{ synced: number; platforms: string[] }> {
  const candidates: ("facebook" | "instagram")[] = ["facebook", "instagram"];
  const done: string[] = [];
  const now = new Date().toISOString();

  for (const platform of candidates) {
    const token = await getDecryptedToken(client, workspaceId, platform);
    if (!token?.externalId) continue;

    let snap: Snapshot | null = null;
    try {
      snap =
        platform === "facebook"
          ? await fetchFacebookPageSnapshot(token.externalId, token.accessToken)
          : await fetchInstagramSnapshot(token.externalId, token.accessToken);
    } catch {
      snap = null;
    }
    if (!snap) continue;

    const { error } = await client.from("analytics_snapshots").insert({
      workspace_id: workspaceId,
      post_id: null,
      platform,
      followers: snap.followers,
      metrics: snap.metrics,
      captured_at: now,
    });
    if (error) continue;

    await client
      .from("connected_accounts")
      .update({ last_sync_at: now })
      .eq("workspace_id", workspaceId)
      .eq("platform", platform);
    done.push(platform);
  }

  return { synced: done.length, platforms: done };
}

/** Manual trigger for the active workspace (session client). Requires auth. */
export async function syncCurrentWorkspace(): Promise<SyncSummary> {
  const ctx = await requireLiveContext();
  const r = await syncWorkspaceAnalytics(ctx.supabase, ctx.workspaceId);
  return {
    ok: true,
    mode: "live",
    synced: r.synced,
    platforms: r.platforms,
    message: r.synced ? undefined : "No connected accounts to sync yet.",
  };
}

/** Cron trigger across all workspaces (service-role). No-op without service role. */
export async function syncAllWorkspaces(): Promise<SyncSummary> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: true, mode: "demo", synced: 0, platforms: [], message: "Service role not configured." };
  }

  const { data } = await admin
    .from("connected_accounts")
    .select("workspace_id")
    .in("platform", ["facebook", "instagram"])
    .eq("status", "connected");

  const workspaces = [...new Set(((data as { workspace_id: string }[] | null) ?? []).map((r) => r.workspace_id))];
  let synced = 0;
  const platforms = new Set<string>();

  for (const ws of workspaces) {
    const r = await syncWorkspaceAnalytics(admin, ws);
    synced += r.synced;
    r.platforms.forEach((p) => platforms.add(p));
  }

  return { ok: true, mode: "live", synced, platforms: [...platforms] };
}
