import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { CompetitorRow, CompetitorPostRow } from "@/lib/db/types";
import {
  competitors as demoCompetitors,
  competitorPosts as demoCompetitorPosts,
} from "@/lib/demo-data";
import type { Platform, PostType } from "@/lib/demo-data";

export type MappedCompetitor = (typeof demoCompetitors)[number];
export type MappedCompetitorPost = (typeof demoCompetitorPosts)[number];

/** Two-letter uppercase initials from a name (e.g. "Growth Lab" → "GL"). */
function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Tailwind gradient classes, chosen deterministically from an id/name. */
const GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-pink-500 to-rose-500",
  "from-neutral-700 to-neutral-900",
  "from-red-500 to-rose-600",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-indigo-600",
  "from-amber-400 to-orange-500",
  "from-fuchsia-500 to-purple-600",
];

function deriveGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function mapCompetitor(row: CompetitorRow): MappedCompetitor {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle ?? "",
    initials: deriveInitials(row.name),
    platform: (row.platform ?? "instagram") as Platform,
    niche: row.niche ?? "",
    url: row.url ?? "",
    followers: row.followers ?? "—",
    postsPerWeek: row.posts_per_week,
    avgEngagement: row.avg_engagement ?? "—",
    topFormat: (row.top_format ?? "text") as PostType,
    gradient: deriveGradient(row.id || row.name),
  };
}

function mapCompetitorPost(
  row: CompetitorPostRow,
  competitorName: string
): MappedCompetitorPost {
  return {
    id: row.id,
    competitor: competitorName,
    title: row.title ?? "",
    format: (row.format ?? "text") as PostType,
    hook: row.hook ?? "",
    engagement: row.engagement ?? "—",
    note: row.note ?? "",
  };
}

/** Active (non-archived) competitors shaped like demo `competitors`. Demo fallback. */
export async function listCompetitors(): Promise<MappedCompetitor[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoCompetitors;

  const { data, error } = await ctx.supabase
    .from("competitors")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return demoCompetitors;
  return (data as CompetitorRow[]).map(mapCompetitor);
}

/** Saved competitor posts shaped like demo `competitorPosts`. Demo fallback. */
export async function listCompetitorPosts(): Promise<MappedCompetitorPost[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoCompetitorPosts;

  const { data, error } = await ctx.supabase
    .from("competitor_posts")
    .select("*, competitors(name)")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return demoCompetitorPosts;

  return (
    data as (CompetitorPostRow & { competitors: { name: string } | null })[]
  ).map((row) => mapCompetitorPost(row, row.competitors?.name ?? ""));
}

export interface CreateCompetitorInput {
  name: string;
  handle?: string | null;
  platform?: Platform | null;
  niche?: string | null;
  url?: string | null;
  followers?: string | null;
  postsPerWeek?: number;
  avgEngagement?: string | null;
  topFormat?: PostType | null;
  notes?: string | null;
}

export async function createCompetitor(
  input: CreateCompetitorInput
): Promise<CompetitorRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("competitors")
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      name: input.name,
      handle: input.handle ?? null,
      platform: input.platform ?? null,
      niche: input.niche ?? null,
      url: input.url ?? null,
      followers: input.followers ?? null,
      posts_per_week: input.postsPerWeek ?? 0,
      avg_engagement: input.avgEngagement ?? null,
      top_format: input.topFormat ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create competitor.");
  return data as CompetitorRow;
}

export async function updateCompetitor(
  id: string,
  input: Partial<CreateCompetitorInput>
): Promise<CompetitorRow> {
  const ctx = await requireLiveContext();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.handle !== undefined) patch.handle = input.handle;
  if (input.platform !== undefined) patch.platform = input.platform;
  if (input.niche !== undefined) patch.niche = input.niche;
  if (input.url !== undefined) patch.url = input.url;
  if (input.followers !== undefined) patch.followers = input.followers;
  if (input.postsPerWeek !== undefined) patch.posts_per_week = input.postsPerWeek;
  if (input.avgEngagement !== undefined) patch.avg_engagement = input.avgEngagement;
  if (input.topFormat !== undefined) patch.top_format = input.topFormat;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await ctx.supabase
    .from("competitors")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update competitor.");
  return data as CompetitorRow;
}

export async function archiveCompetitor(id: string): Promise<CompetitorRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("competitors")
    .update({ archived: true })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to archive competitor.");
  return data as CompetitorRow;
}

export async function deleteCompetitor(id: string): Promise<string> {
  const ctx = await requireLiveContext();
  const { error } = await ctx.supabase
    .from("competitors")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId);
  if (error) throw error;
  return id;
}

export interface CompetitorPostInput {
  title?: string | null;
  format?: PostType | null;
  hook?: string | null;
  engagement?: string | null;
  note?: string | null;
  url?: string | null;
}

export async function addCompetitorPost(
  competitorId: string,
  input: CompetitorPostInput
): Promise<CompetitorPostRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("competitor_posts")
    .insert({
      workspace_id: ctx.workspaceId,
      competitor_id: competitorId,
      title: input.title ?? null,
      format: input.format ?? null,
      hook: input.hook ?? null,
      engagement: input.engagement ?? null,
      note: input.note ?? null,
      url: input.url ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to add competitor post.");
  return data as CompetitorPostRow;
}
