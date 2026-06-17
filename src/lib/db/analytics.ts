import "server-only";
import { getDbContext, isLive } from "@/lib/db/context";

/**
 * Read access to synced analytics. Demo/preview returns an empty live summary so
 * the analytics page keeps its showcase charts; live mode surfaces the latest
 * account-level snapshot per platform.
 */

export interface PlatformSnapshot {
  platform: string;
  followers: number;
  capturedAt: string;
}

export interface AnalyticsSummary {
  live: boolean;
  syncedAt: string | null;
  platforms: PlatformSnapshot[];
}

interface SnapshotRow {
  platform: string;
  followers: number | null;
  captured_at: string;
}

/** Latest account-level snapshot per platform for the active workspace. */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return { live: false, syncedAt: null, platforms: [] };

  const { data, error } = await ctx.supabase
    .from("analytics_snapshots")
    .select("platform, followers, captured_at")
    .eq("workspace_id", ctx.workspaceId)
    .is("post_id", null)
    .order("captured_at", { ascending: false })
    .limit(50);

  if (error || !data) return { live: true, syncedAt: null, platforms: [] };

  const latest = new Map<string, SnapshotRow>();
  for (const row of data as SnapshotRow[]) {
    if (!latest.has(row.platform)) latest.set(row.platform, row);
  }

  const platforms: PlatformSnapshot[] = [...latest.values()].map((r) => ({
    platform: r.platform,
    followers: r.followers ?? 0,
    capturedAt: r.captured_at,
  }));

  const syncedAt = platforms.reduce<string | null>(
    (acc, p) => (acc && acc > p.capturedAt ? acc : p.capturedAt),
    null
  );

  return { live: true, syncedAt, platforms };
}
