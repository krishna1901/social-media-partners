import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type {
  ContentIdeaRow,
  PostType,
  Priority,
  IdeaStatus,
} from "@/lib/db/types";
import { ideas as demoIdeas } from "@/lib/demo-data";

/** Demo-facing shape consumed by the ideas UI (matches `@/lib/demo-data` `ideas`). */
export type MappedIdea = (typeof demoIdeas)[number];

/** DB idea status — superset of demo `IdeaStatus` (DB also allows 'archived'). */
export type DbIdeaStatus = IdeaStatus | "archived";

/** Editable fields a create/update accepts. */
export interface IdeaInput {
  title?: string;
  category?: string | null;
  source_trend?: string | null;
  priority?: Priority;
  content_type?: PostType;
  status?: DbIdeaStatus;
  notes?: string | null;
}

/** Map a DB row to the demo-facing list shape. */
function toMappedIdea(row: ContentIdeaRow): MappedIdea {
  return {
    id: row.id,
    title: row.title,
    category: row.category ?? "",
    sourceTrend: row.source_trend ?? undefined,
    priority: row.priority,
    type: row.content_type,
    status: row.status as MappedIdea["status"],
    notes: row.notes ?? undefined,
  };
}

/** List ideas for the active workspace; demo fallback when not live/empty/error. */
export async function listIdeas(): Promise<MappedIdea[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoIdeas;

  const { data, error } = await ctx.supabase
    .from("content_ideas")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return demoIdeas;
  return (data as ContentIdeaRow[]).map(toMappedIdea);
}

/** Create an idea scoped to the active workspace. Returns the new row. */
export async function createIdea(input: IdeaInput): Promise<ContentIdeaRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("content_ideas")
    .insert({ ...input, workspace_id: ctx.workspaceId, created_by: ctx.userId })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create idea.");
  return data as ContentIdeaRow;
}

/** Update editable fields on an idea. Returns the updated row. */
export async function updateIdea(
  id: string,
  input: IdeaInput
): Promise<ContentIdeaRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("content_ideas")
    .update(input)
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update idea.");
  return data as ContentIdeaRow;
}

/** Archive an idea (status='archived'). Returns the updated row. */
export async function archiveIdea(id: string): Promise<ContentIdeaRow> {
  return updateIdea(id, { status: "archived" });
}

/** Permanently delete an idea. Returns the deleted id. */
export async function deleteIdea(id: string): Promise<string> {
  const ctx = await requireLiveContext();
  const { error } = await ctx.supabase
    .from("content_ideas")
    .delete()
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", id);
  if (error) throw error;
  return id;
}

/**
 * Convert an idea into a post: insert a post from the idea's fields, then mark
 * the idea converted (converted_post_id + status). Returns the new post id.
 */
export async function convertIdeaToPost(ideaId: string): Promise<string> {
  const ctx = await requireLiveContext();

  const { data: idea, error: ideaError } = await ctx.supabase
    .from("content_ideas")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", ideaId)
    .single();
  if (ideaError || !idea) throw ideaError ?? new Error("Idea not found.");

  const row = idea as ContentIdeaRow;
  const { data: post, error: postError } = await ctx.supabase
    .from("posts")
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      title: row.title,
      topic: row.category,
      post_type: row.content_type,
      status: "draft",
      notes: row.notes,
    })
    .select("id")
    .single();
  if (postError || !post) throw postError ?? new Error("Failed to create post.");

  const postId = post.id as string;
  const { error: updateError } = await ctx.supabase
    .from("content_ideas")
    .update({ converted_post_id: postId, status: "draft" })
    .eq("workspace_id", ctx.workspaceId)
    .eq("id", ideaId);
  if (updateError) throw updateError;

  return postId;
}
