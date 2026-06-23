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

/* --------------------------- CSV export data ------------------------------- */

export interface AnalyticsExportRow {
  scope: "workspace" | "post";
  label: string;
  platform: string;
  reach: number;
  impressions: number;
  engagement: number;
  saves: number;
  shares: number;
  comments: number;
  clicks: number;
  followers: number;
  capturedAt: string;
}

export interface AnalyticsExport {
  live: boolean;
  workspaceName: string | null;
  syncedAt: string | null;
  /** Latest workspace-level snapshot per platform (post_id is null). */
  workspaceRows: AnalyticsExportRow[];
  /** Latest snapshot per post (post_id is set). */
  postRows: AnalyticsExportRow[];
}

interface FullSnapshotRow {
  platform: string | null;
  reach: number | null;
  impressions: number | null;
  engagement: number | null;
  saves: number | null;
  shares: number | null;
  comments: number | null;
  clicks: number | null;
  followers: number | null;
  captured_at: string;
  post_id: string | null;
  posts: { title: string } | { title: string }[] | null;
}

function titleCase(value: string | null): string {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Gathers the live workspace's analytics into a flat, CSV-ready shape. Demo /
 * preview returns `live: false` so the client export falls back to the showcase
 * datasets. Never throws — on any error it returns empty rows so the export
 * still produces a valid (header-only) CSV.
 */
export async function getAnalyticsExport(): Promise<AnalyticsExport> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return { live: false, workspaceName: null, syncedAt: null, workspaceRows: [], postRows: [] };
  }

  const [wsRes, snapRes] = await Promise.all([
    ctx.supabase.from("workspaces").select("name").eq("id", ctx.workspaceId).maybeSingle(),
    ctx.supabase
      .from("analytics_snapshots")
      .select(
        "platform, reach, impressions, engagement, saves, shares, comments, clicks, followers, captured_at, post_id, posts(title)"
      )
      .eq("workspace_id", ctx.workspaceId)
      .order("captured_at", { ascending: false })
      .limit(500),
  ]);

  const workspaceName = (wsRes.data as { name: string } | null)?.name ?? null;
  if (snapRes.error || !snapRes.data) {
    return { live: true, workspaceName, syncedAt: null, workspaceRows: [], postRows: [] };
  }

  const rows = snapRes.data as unknown as FullSnapshotRow[];
  const toRow = (
    r: FullSnapshotRow,
    scope: "workspace" | "post",
    label: string
  ): AnalyticsExportRow => ({
    scope,
    label,
    platform: r.platform ?? "—",
    reach: r.reach ?? 0,
    impressions: r.impressions ?? 0,
    engagement: r.engagement ?? 0,
    saves: r.saves ?? 0,
    shares: r.shares ?? 0,
    comments: r.comments ?? 0,
    clicks: r.clicks ?? 0,
    followers: r.followers ?? 0,
    capturedAt: r.captured_at,
  });

  // Rows arrive newest-first, so the first time we see a key it is the latest.
  const latestByPlatform = new Map<string, FullSnapshotRow>();
  const latestByPost = new Map<string, FullSnapshotRow>();
  for (const r of rows) {
    if (r.post_id) {
      if (!latestByPost.has(r.post_id)) latestByPost.set(r.post_id, r);
    } else {
      const key = r.platform ?? "—";
      if (!latestByPlatform.has(key)) latestByPlatform.set(key, r);
    }
  }

  const workspaceRows = [...latestByPlatform.values()].map((r) =>
    toRow(r, "workspace", titleCase(r.platform))
  );
  const postRows = [...latestByPost.values()].map((r) => {
    const post = Array.isArray(r.posts) ? r.posts[0] : r.posts;
    return toRow(r, "post", post?.title ?? "Untitled post");
  });

  const syncedAt = rows.reduce<string | null>(
    (acc, r) => (acc && acc > r.captured_at ? acc : r.captured_at),
    null
  );

  return { live: true, workspaceName, syncedAt, workspaceRows, postRows };
}
