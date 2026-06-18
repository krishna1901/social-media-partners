import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { PostRow, Platform, PostType, PostStatus } from "@/lib/db/types";
import { posts as demoPosts, dashboardStats } from "@/lib/demo-data";

/** Demo-facing shape consumed by the posts UI (matches `@/lib/demo-data` `posts`). */
export type MappedPost = (typeof demoPosts)[number] & {
  /** First attached image URL (live posts), when present. */
  image?: string;
};

/** DB post status — superset of the demo `PostStatus` (DB also allows 'archived'). */
export type DbPostStatus = PostStatus | "archived";

/** Counts shown on the dashboard. */
export interface PostCounts {
  total: number;
  drafts: number;
  scheduled: number;
  posted: number;
}

/** Editable fields a create/update accepts. */
export interface PostInput {
  title?: string;
  topic?: string | null;
  post_type?: PostType;
  status?: DbPostStatus;
  instagram_caption?: string | null;
  linkedin_caption?: string | null;
  universal_caption?: string | null;
  hashtags?: string | null;
  cta?: string | null;
  notes?: string | null;
  scheduled_at?: string | null;
}

/** A post row joined with its post_channels (as Supabase returns nested rows). */
interface PostRowWithChannels extends Omit<PostRow, "platforms"> {
  post_channels: { platform: Platform; enabled: boolean }[] | null;
  media_assets: { url: string | null; kind: string; archived: boolean }[] | null;
}

/** "Mmm d, yyyy" (e.g. "Jun 18, 2026") from an ISO timestamp. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Enabled platforms for a post, in a stable order. */
function platformsFromChannels(
  channels: { platform: Platform; enabled: boolean }[] | null | undefined
): Platform[] {
  return (channels ?? []).filter((c) => c.enabled).map((c) => c.platform);
}

/** Map a joined DB row to the demo-facing list shape. */
function toMappedPost(row: PostRowWithChannels): MappedPost {
  const image = (row.media_assets ?? [])
    .filter((m) => !m.archived && m.kind === "image" && m.url)
    .map((m) => m.url as string)[0];
  return {
    id: row.id,
    title: row.title,
    excerpt: row.topic ?? row.universal_caption ?? "",
    platforms: platformsFromChannels(row.post_channels),
    type: row.post_type,
    status: row.status,
    date: formatDate(row.scheduled_at ?? row.created_at),
    author: "You",
    image,
  };
}

/** List posts for the active workspace; demo fallback when not live/empty/error. */
export async function listPosts(): Promise<MappedPost[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoPosts;

  const { data, error } = await ctx.supabase
    .from("posts")
    .select("*, post_channels(platform,enabled), media_assets(url,kind,archived)")
    .eq("workspace_id", ctx.workspaceId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as PostRowWithChannels[]).map(toMappedPost);
}

/** Full post row (incl. enabled `platforms`) for one post, or null. */
export async function getPost(id: string): Promise<PostRow | null> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return null;

  const { data, error } = await ctx.supabase
    .from("posts")
    .select("*, post_channels(platform,enabled)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as PostRowWithChannels;
  const { post_channels, ...rest } = row;
  return { ...rest, platforms: platformsFromChannels(post_channels) };
}

/** Create a post scoped to the active workspace. Returns the new row. */
export async function createPost(input: PostInput): Promise<PostRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("posts")
    .insert({ ...input, workspace_id: ctx.workspaceId, created_by: ctx.userId })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create post.");
  return data as PostRow;
}

/** Update editable fields on a post. Returns the updated row. */
export async function updatePost(id: string, input: PostInput): Promise<PostRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("posts")
    .update(input)
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update post.");
  return data as PostRow;
}

/** Replace a post's post_channels rows with the given platforms. */
export async function setPostChannels(
  postId: string,
  platforms: Platform[]
): Promise<void> {
  const ctx = await requireLiveContext();

  const { error: delError } = await ctx.supabase
    .from("post_channels")
    .delete()
    .eq("workspace_id", ctx.workspaceId)
    .eq("post_id", postId);
  if (delError) throw delError;

  if (platforms.length === 0) return;

  const rows = platforms.map((platform) => ({
    workspace_id: ctx.workspaceId,
    post_id: postId,
    platform,
    enabled: true,
  }));
  const { error: insError } = await ctx.supabase.from("post_channels").insert(rows);
  if (insError) throw insError;
}

/** Set a post's status. Returns the updated row. */
export async function updatePostStatus(
  id: string,
  status: DbPostStatus
): Promise<PostRow> {
  return updatePost(id, { status });
}

/** Duplicate a post (and its channels) as a fresh draft. Returns the new id. */
export async function duplicatePost(id: string): Promise<string> {
  const ctx = await requireLiveContext();

  const { data: source, error: srcError } = await ctx.supabase
    .from("posts")
    .select("*, post_channels(platform,enabled)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id)
    .single();
  if (srcError || !source) throw srcError ?? new Error("Post not found.");

  const row = source as PostRowWithChannels;
  const { data: created, error: insError } = await ctx.supabase
    .from("posts")
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      title: `${row.title} (copy)`,
      topic: row.topic,
      post_type: row.post_type,
      status: "draft",
      instagram_caption: row.instagram_caption,
      linkedin_caption: row.linkedin_caption,
      universal_caption: row.universal_caption,
      hashtags: row.hashtags,
      cta: row.cta,
      notes: row.notes,
    })
    .select("id")
    .single();
  if (insError || !created) throw insError ?? new Error("Failed to duplicate post.");

  const platforms = platformsFromChannels(row.post_channels);
  if (platforms.length > 0) {
    await ctx.supabase.from("post_channels").insert(
      platforms.map((platform) => ({
        workspace_id: ctx.workspaceId,
        post_id: created.id as string,
        platform,
        enabled: true,
      }))
    );
  }
  return created.id as string;
}

/** Archive a post (status='archived'). Returns the updated row. */
export async function archivePost(id: string): Promise<PostRow> {
  return updatePostStatus(id, "archived");
}

/** Permanently delete a post. Returns the deleted id. */
export async function deletePost(id: string): Promise<string> {
  const ctx = await requireLiveContext();
  const { error } = await ctx.supabase
    .from("posts")
    .delete()
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id);
  if (error) throw error;
  return id;
}

/** Dashboard counts; demo numbers (derived from dashboardStats) as fallback. */
export async function getPostCounts(): Promise<PostCounts> {
  const ctx = await getDbContext();

  const stat = (key: string): number => {
    const raw = dashboardStats.find((s) => s.key === key)?.value ?? "0";
    return Number(raw.replace(/[^0-9.]/g, "")) || 0;
  };
  const demoCounts: PostCounts = {
    total: stat("total-posts"),
    drafts: stat("drafts"),
    scheduled: stat("scheduled"),
    posted: 0,
  };

  if (!isLive(ctx)) return demoCounts;

  const countFor = async (status?: DbPostStatus): Promise<number | null> => {
    let query = ctx.supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspaceId);
    if (status) query = query.eq("status", status);
    else query = query.neq("status", "archived");
    const { count, error } = await query;
    return error ? null : count ?? 0;
  };

  const [total, drafts, scheduled, posted] = await Promise.all([
    countFor(),
    countFor("draft"),
    countFor("scheduled"),
    countFor("posted"),
  ]);

  if (total === null || drafts === null || scheduled === null || posted === null) {
    // Live but a count query errored — report zeros, never demo numbers.
    return { total: total ?? 0, drafts: drafts ?? 0, scheduled: scheduled ?? 0, posted: posted ?? 0 };
  }
  return { total, drafts, scheduled, posted };
}
