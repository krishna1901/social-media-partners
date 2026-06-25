import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import { sendPlatformReply, type ReplyStatus } from "@/lib/automations/reply";
import type { InboxRow } from "@/lib/db/types";
import { inboxThreads as demoInbox } from "@/lib/demo-data";

export type MappedInboxThread = (typeof demoInbox)[number];

/** Compact relative time (e.g. "12m ago", "3h ago", "2d ago"). */
function relativeTime(iso: string | null): string {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const diffMs = Date.now() - then;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  return `${wk}w ago`;
}

/** Two-letter uppercase initials from an author name. */
function deriveInitials(name: string | null, handle: string | null): string {
  const base = (name ?? handle ?? "").replace(/^@/, "").trim();
  if (!base) return "??";
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function mapInbox(row: InboxRow): MappedInboxThread {
  const thread: MappedInboxThread = {
    id: row.id,
    author: row.author_name ?? row.author_handle ?? "Unknown",
    handle: row.author_handle ?? "",
    initials: deriveInitials(row.author_name, row.author_handle),
    platform: row.platform,
    type: row.type,
    preview: row.content ?? "",
    time: relativeTime(row.received_at ?? row.created_at),
    status: row.status,
    sentiment: row.sentiment,
  };
  // Optional demo fields — only set when present.
  if (row.related_post_id) thread.relatedPost = row.related_post_id;
  if (row.suggested_reply) thread.suggestedReply = row.suggested_reply;
  return thread;
}

/** Unified inbox items shaped like demo `inboxThreads`. Demo fallback. */
export async function listInbox(): Promise<MappedInboxThread[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoInbox;

  const { data, error } = await ctx.supabase
    .from("comments_inbox")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    // nullsFirst:false keeps real received timestamps dominating the sort and
    // pushes NULL-dated rows to the bottom (they fall back to created_at in the
    // display), instead of Postgres' default of NULLs-first on DESC.
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as InboxRow[]).map(mapInbox);
}

export async function updateInboxStatus(
  id: string,
  status: InboxRow["status"]
): Promise<InboxRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("comments_inbox")
    .update({ status })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update inbox status.");
  return data as InboxRow;
}

export async function updateInboxSentiment(
  id: string,
  sentiment: InboxRow["sentiment"]
): Promise<InboxRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("comments_inbox")
    .update({ sentiment })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update inbox sentiment.");
  return data as InboxRow;
}

export async function saveReplyDraft(id: string, draft: string): Promise<InboxRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("comments_inbox")
    .update({ reply_draft: draft })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to save reply draft.");
  return data as InboxRow;
}

export async function markReplied(id: string): Promise<InboxRow> {
  return updateInboxStatus(id, "replied");
}

/**
 * Human-in-the-loop reply: posts `text` to the platform via the reply
 * dispatcher (simulate-safe), then saves the draft and marks the item replied.
 * On an honest send failure (simulate off) the draft is persisted and the error
 * is surfaced so the item stays actionable.
 */
export async function sendReply(
  id: string,
  text: string
): Promise<{ row: InboxRow; status: ReplyStatus; message: string }> {
  const ctx = await requireLiveContext();
  const { data: existing, error: fetchErr } = await ctx.supabase
    .from("comments_inbox")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .single();
  if (fetchErr || !existing) throw fetchErr ?? new Error("Inbox item not found.");

  const result = await sendPlatformReply(ctx.supabase, existing as InboxRow, text);
  if (!result.ok) {
    // Persist the draft so the human can retry; leave status unchanged.
    await ctx.supabase
      .from("comments_inbox")
      .update({ reply_draft: text })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);
    throw new Error(result.message);
  }

  const { data, error } = await ctx.supabase
    .from("comments_inbox")
    .update({ reply_draft: text, status: "replied" })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to mark replied.");
  return { row: data as InboxRow, status: result.status, message: result.message };
}

export async function markIgnored(id: string): Promise<InboxRow> {
  return updateInboxStatus(id, "ignored");
}
