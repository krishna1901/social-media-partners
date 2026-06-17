import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireLiveContext } from "@/lib/db/context";
import { getDecryptedToken } from "@/lib/db/social-tokens";

/**
 * Phase 3F — inbox / comment sync.
 *
 * Pulls recent comments from connected Meta surfaces (Facebook Page posts +
 * Instagram media) into `comments_inbox`, deduped by `external_id`. Uses stored
 * decrypted tokens via the provided client. Demo/preview is a no-op.
 */

const GRAPH = "https://graph.facebook.com/v21.0";
const POST_LIMIT = 10;
const COMMENT_LIMIT = 25;

export interface InboxSyncSummary {
  ok: boolean;
  mode: "live" | "demo";
  synced: number;
  platforms: string[];
  message?: string;
}

interface InboxItem {
  externalId: string;
  platform: "facebook" | "instagram";
  authorName: string | null;
  content: string;
  receivedAt: string | null;
}

async function getJSON(url: string): Promise<{ data?: unknown[] } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as { data?: unknown[] };
}

async function fetchFacebookComments(pageId: string, token: string): Promise<InboxItem[]> {
  const out: InboxItem[] = [];
  const posts = await getJSON(
    `${GRAPH}/${pageId}/posts?${new URLSearchParams({ fields: "id", limit: String(POST_LIMIT), access_token: token })}`
  );
  for (const post of (posts?.data ?? []) as { id: string }[]) {
    const comments = await getJSON(
      `${GRAPH}/${post.id}/comments?${new URLSearchParams({
        fields: "id,message,from,created_time",
        limit: String(COMMENT_LIMIT),
        access_token: token,
      })}`
    );
    for (const c of (comments?.data ?? []) as {
      id: string;
      message?: string;
      from?: { name?: string };
      created_time?: string;
    }[]) {
      out.push({
        externalId: c.id,
        platform: "facebook",
        authorName: c.from?.name ?? null,
        content: c.message ?? "",
        receivedAt: c.created_time ?? null,
      });
    }
  }
  return out;
}

async function fetchInstagramComments(igId: string, token: string): Promise<InboxItem[]> {
  const out: InboxItem[] = [];
  const media = await getJSON(
    `${GRAPH}/${igId}/media?${new URLSearchParams({ fields: "id", limit: String(POST_LIMIT), access_token: token })}`
  );
  for (const m of (media?.data ?? []) as { id: string }[]) {
    const comments = await getJSON(
      `${GRAPH}/${m.id}/comments?${new URLSearchParams({
        fields: "id,text,username,timestamp",
        limit: String(COMMENT_LIMIT),
        access_token: token,
      })}`
    );
    for (const c of (comments?.data ?? []) as {
      id: string;
      text?: string;
      username?: string;
      timestamp?: string;
    }[]) {
      out.push({
        externalId: c.id,
        platform: "instagram",
        authorName: c.username ?? null,
        content: c.text ?? "",
        receivedAt: c.timestamp ?? null,
      });
    }
  }
  return out;
}

/** Sync one workspace's connected platforms' comments. */
export async function syncWorkspaceInbox(
  client: SupabaseClient,
  workspaceId: string
): Promise<{ synced: number; platforms: string[] }> {
  const candidates: ("facebook" | "instagram")[] = ["facebook", "instagram"];
  const done: string[] = [];
  let synced = 0;

  for (const platform of candidates) {
    const token = await getDecryptedToken(client, workspaceId, platform);
    if (!token?.externalId) continue;

    let items: InboxItem[] = [];
    try {
      items =
        platform === "facebook"
          ? await fetchFacebookComments(token.externalId, token.accessToken)
          : await fetchInstagramComments(token.externalId, token.accessToken);
    } catch {
      items = [];
    }
    if (items.length === 0) {
      done.push(platform);
      continue;
    }

    const rows = items.map((i) => ({
      workspace_id: workspaceId,
      platform: i.platform,
      type: "comment" as const,
      author_name: i.authorName,
      author_handle: i.authorName,
      content: i.content,
      sentiment: "neutral" as const,
      status: "new" as const,
      external_id: i.externalId,
      received_at: i.receivedAt,
    }));

    const { error } = await client
      .from("comments_inbox")
      .upsert(rows, { onConflict: "workspace_id,platform,external_id", ignoreDuplicates: true });
    if (!error) {
      synced += rows.length;
      done.push(platform);
    }
  }

  return { synced, platforms: done };
}

/** Manual trigger for the active workspace (session client). */
export async function syncCurrentWorkspaceInbox(): Promise<InboxSyncSummary> {
  const ctx = await requireLiveContext();
  const r = await syncWorkspaceInbox(ctx.supabase, ctx.workspaceId);
  return {
    ok: true,
    mode: "live",
    synced: r.synced,
    platforms: r.platforms,
    message: r.platforms.length ? undefined : "No connected accounts to sync yet.",
  };
}

/** Cron trigger across all workspaces (service-role). No-op without service role. */
export async function syncAllWorkspacesInbox(): Promise<InboxSyncSummary> {
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
    const r = await syncWorkspaceInbox(admin, ws);
    synced += r.synced;
    r.platforms.forEach((p) => platforms.add(p));
  }
  return { ok: true, mode: "live", synced, platforms: [...platforms] };
}
