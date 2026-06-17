import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { TrendRow } from "@/lib/db/types";
import { trends as demoTrends } from "@/lib/demo-data";
import type { Platform } from "@/lib/demo-data";

/** Demo-facing trend item shape (matches `@/lib/demo-data` `trends` element). */
export type MappedTrend = (typeof demoTrends)[number];

function mapTrend(row: TrendRow): MappedTrend {
  return {
    id: row.id,
    tag: row.tag,
    category: row.category ?? "",
    relevance: row.relevance,
    growth: row.growth ?? "",
    momentum: row.momentum ?? "steady",
    platform: (row.platform ?? "instagram") as Platform,
    source: row.source ?? "",
    note: row.note ?? "",
  };
}

/** Trend radar signals shaped like the demo `trends` array. Demo fallback. */
export async function listTrends(): Promise<MappedTrend[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoTrends;

  const { data, error } = await ctx.supabase
    .from("trends")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .neq("status", "archived")
    .order("relevance", { ascending: false });

  if (error || !data || data.length === 0) return demoTrends;
  return (data as TrendRow[]).map(mapTrend);
}

export interface CreateTrendInput {
  tag: string;
  category?: string | null;
  relevance?: number;
  growth?: string | null;
  momentum?: TrendRow["momentum"];
  platform?: Platform | null;
  source?: string | null;
  note?: string | null;
}

export async function createTrend(input: CreateTrendInput): Promise<TrendRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("trends")
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      tag: input.tag,
      category: input.category ?? null,
      relevance: input.relevance ?? 0,
      growth: input.growth ?? null,
      momentum: input.momentum ?? null,
      platform: input.platform ?? null,
      source: input.source ?? null,
      note: input.note ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create trend.");
  return data as TrendRow;
}

export type UpdateTrendInput = Partial<CreateTrendInput> & {
  status?: TrendRow["status"];
};

export async function updateTrend(
  id: string,
  input: UpdateTrendInput
): Promise<TrendRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("trends")
    .update(input)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update trend.");
  return data as TrendRow;
}

/**
 * Creates a content_ideas row seeded from a trend, then marks the trend
 * `status = 'saved'`. Returns the new idea id.
 */
export async function saveTrendAsIdea(trendId: string): Promise<string> {
  const ctx = await requireLiveContext();

  const { data: trend, error: trendError } = await ctx.supabase
    .from("trends")
    .select("*")
    .eq("id", trendId)
    .eq("workspace_id", ctx.workspaceId)
    .single();
  if (trendError || !trend) {
    throw trendError ?? new Error("Trend not found.");
  }
  const t = trend as TrendRow;

  const { data: idea, error: ideaError } = await ctx.supabase
    .from("content_ideas")
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      title: t.tag,
      category: t.category ?? null,
      source_trend: t.tag,
      priority: "medium",
      content_type: "text",
      status: "idea",
      notes: t.note ?? null,
    })
    .select("id")
    .single();
  if (ideaError || !idea) {
    throw ideaError ?? new Error("Failed to create idea from trend.");
  }

  await ctx.supabase
    .from("trends")
    .update({ status: "saved" })
    .eq("id", trendId)
    .eq("workspace_id", ctx.workspaceId);

  return idea.id as string;
}

export async function archiveTrend(id: string): Promise<TrendRow> {
  return updateTrend(id, { status: "archived" });
}
