import { CheckCircle2 } from "lucide-react";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { getAnalyticsSummary } from "@/lib/db/analytics";
import type { Platform } from "@/lib/demo-data";
import { formatNumber } from "@/lib/demo-data";
import { AnalyticsView } from "./_view";
import { AnalyticsSyncButton } from "./_sync-button";

/**
 * Analytics (server) — adds a "Sync now" control and, when synced live data
 * exists, a real per-platform follower strip above the showcase charts. Demo /
 * preview keeps the existing visualizations unchanged.
 */
export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary();

  const liveStrip =
    summary.live && summary.platforms.length > 0 ? (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live connected accounts
          </h2>
          {summary.syncedAt && (
            <span className="text-xs text-muted-foreground">
              Synced {new Date(summary.syncedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {summary.platforms.map((p) => (
            <div key={p.platform} className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <PlatformBadge platform={p.platform as Platform} />
              <p className="mt-2 text-lg font-bold tabular-nums text-foreground">
                {formatNumber(p.followers)}
              </p>
              <p className="text-[11px] text-muted-foreground">Followers</p>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return <AnalyticsView syncControl={<AnalyticsSyncButton />} liveStrip={liveStrip} />;
}
