import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { MediaAssetRow } from "@/lib/db/types";
import { mediaAssets as demoMediaAssets } from "@/lib/demo-data";

/** Demo-facing shape consumed by the media UI (matches demo `mediaAssets`). */
export type MappedMedia = (typeof demoMediaAssets)[number];

/** Fields a create accepts (storage-backed asset metadata). */
export interface MediaInput {
  name: string;
  kind?: MediaAssetRow["kind"];
  bucket?: string;
  path?: string | null;
  url?: string | null;
  size_bytes?: number | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  dimensions?: string | null;
}

/** Editable subset for updates. */
export type MediaUpdateInput = Partial<MediaInput>;

/** A media row joined with its linked post's title. */
interface MediaRowWithPost extends MediaAssetRow {
  posts: { title: string } | null;
}

/** Deterministic gradient palette, picked by row index. */
const GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-violet-500 to-indigo-600",
  "from-sky-500 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
  "from-blue-500 to-indigo-500",
  "from-fuchsia-500 to-purple-600",
] as const;

function gradientForIndex(index: number): string {
  return GRADIENTS[index % GRADIENTS.length];
}

/** Human-readable byte size (e.g. "2.1 MB", "640 KB"). */
function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1).replace(/\.0$/, "")} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1).replace(/\.0$/, "")} GB`;
}

/** Relative "updated" label (e.g. "2h ago", "Yesterday", "3d ago"). */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Map a DB row (with linked post) to the demo-facing list shape. */
function toMappedMedia(row: MediaRowWithPost, index: number): MappedMedia {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    size: formatSize(row.size_bytes),
    dimensions: row.dimensions ?? undefined,
    updated: relativeTime(row.updated_at ?? row.created_at),
    linkedPost: row.posts?.title ?? undefined,
    gradient: gradientForIndex(index),
  };
}

/** List media for the active workspace; demo fallback when not live/empty/error. */
export async function listMedia(): Promise<MappedMedia[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoMediaAssets;

  const { data, error } = await ctx.supabase
    .from("media_assets")
    .select("*, posts:linked_post_id(title)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as MediaRowWithPost[]).map(toMappedMedia);
}

/** Create a media asset scoped to the active workspace. Returns the new row. */
export async function createMediaAsset(input: MediaInput): Promise<MediaAssetRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("media_assets")
    .insert({ ...input, workspace_id: ctx.workspaceId, created_by: ctx.userId })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create media asset.");
  return data as MediaAssetRow;
}

/** Update editable fields on a media asset. Returns the updated row. */
export async function updateMediaAsset(
  id: string,
  input: MediaUpdateInput
): Promise<MediaAssetRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("media_assets")
    .update(input)
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update media asset.");
  return data as MediaAssetRow;
}

/** Link a media asset to a post. Returns the updated row. */
export async function linkMediaToPost(
  mediaId: string,
  postId: string
): Promise<MediaAssetRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("media_assets")
    .update({ linked_post_id: postId })
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", mediaId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to link media to post.");
  return data as MediaAssetRow;
}

/** Archive a media asset (archived=true). Returns the updated row. */
export async function archiveMedia(id: string): Promise<MediaAssetRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("media_assets")
    .update({ archived: true })
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to archive media asset.");
  return data as MediaAssetRow;
}

/** Permanently delete a media asset. Returns the deleted id. */
export async function deleteMedia(id: string): Promise<string> {
  const ctx = await requireLiveContext();
  const { error } = await ctx.supabase
    .from("media_assets")
    .delete()
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id);
  if (error) throw error;
  return id;
}
