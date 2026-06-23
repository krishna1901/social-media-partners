"use client";

import type { ReactNode } from "react";
import { BarChart3, CalendarCheck, Rocket, LayoutGrid } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { InsightCard } from "@/components/ui/insight-card";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField } from "@/components/ui/select-field";
import { Progress } from "@/components/ui/progress";
import { PlatformBadge, PlatformChip } from "@/components/ui/platform-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import {
  analyticsMetrics,
  analyticsReachSeries,
  analyticsTopPosts,
  platformComparison,
  bestPostingTimes,
  contentTypePerformance,
  platformBreakdown,
  engagementTrend,
  formatNumber,
} from "@/lib/demo-data";

// Inline sparklines to enrich the headline metrics (local demo data).
const metricSparks: Record<string, number[]> = {
  reach: [62, 68, 64, 75, 81, 78, 92, 100],
  impressions: [40, 44, 41, 52, 58, 61, 70, 76],
  engagement: [12, 14, 13, 18, 22, 21, 26, 31],
  saves: [4, 5, 5, 7, 9, 8, 11, 13],
};

// Short secondary context per metric — keeps the row from feeling empty.
const metricHints: Record<string, string> = {
  reach: "Accounts reached",
  impressions: "Total views",
  engagement: "Likes, comments & saves",
  saves: "Bookmarked posts",
  shares: "Reposts & shares",
  comments: "Replies received",
  clicks: "Outbound link taps",
  followers: "vs. last period",
};

// Heatmap hour columns (6 AM → 10 PM, every 2 hours).
const HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

function hourLabel(h: number) {
  const period = h >= 12 ? "p" : "a";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

// Used to scale the heatmap tint intensity per day.
const maxHoursPerDay = Math.max(...bestPostingTimes.map((d) => d.hours.length));

export function AnalyticsView({
  syncControl,
  exportControl,
  liveStrip,
  demo,
}: {
  syncControl?: ReactNode;
  exportControl?: ReactNode;
  liveStrip?: ReactNode;
  demo: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Performance"
        description="Track reach, engagement and growth across platforms."
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <>
            {syncControl}
            <SelectField
              aria-label="Date range"
              options={["Last 7 days", "Last 30 days", "Last 90 days", "This year"]}
              defaultValue="Last 30 days"
              className="w-36"
            />
            <SelectField
              aria-label="Platform"
              options={[
                "All platforms",
                { value: "instagram", label: "Instagram" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "tiktok", label: "TikTok" },
                { value: "youtube", label: "YouTube" },
                { value: "x", label: "X" },
              ]}
              defaultValue="All platforms"
              className="w-36"
            />
            {exportControl}
          </>
        }
      />

      {liveStrip}

      {demo ? (
        <>
      {/* Headline metrics */}
      <div className="grid animate-pop grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {analyticsMetrics.map((m) => (
          <StatCard
            key={m.key}
            label={m.label}
            value={m.value}
            delta={m.delta}
            positive={m.positive}
            hint={metricHints[m.key]}
            spark={metricSparks[m.key]}
          />
        ))}
      </div>

      {/* Charts row 1: reach over time + platform mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Reach over time"
          subtitle="Weekly accounts reached across all platforms"
          className="lg:col-span-2"
          action={
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              +58.9% vs prior period
            </span>
          }
          footer={<span>412.8K total reach · peak of 124K in Wk 8</span>}
        >
          <AreaChart
            data={analyticsReachSeries}
            valueFormatter={formatNumber}
            color="var(--chart-3)"
            height={240}
            showYAxis
          />
        </ChartCard>

        <ChartCard title="Platform mix" subtitle="Share of total reach">
          <DonutChart
            data={platformBreakdown}
            centerLabel="412.8K"
            centerSublabel="Total reach"
            size={150}
          />
        </ChartCard>
      </div>

      {/* Charts row 2: engagement trend + content type performance */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Engagement trend" subtitle="8-week engagement rate (%)">
          <AreaChart
            data={engagementTrend}
            valueFormatter={(n) => `${n}%`}
            color="var(--chart-1)"
            height={220}
            showYAxis
          />
        </ChartCard>

        <ChartCard title="Content type performance" subtitle="Avg. engagement rate by format">
          <BarChart
            data={contentTypePerformance}
            showValues
            showAxis
            valueFormatter={(n) => `${n}%`}
            height={220}
            barClassName="from-violet-500 to-indigo-400 group-hover:from-violet-600 group-hover:to-indigo-500"
          />
        </ChartCard>
      </div>

      {/* Platform comparison + Top posts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Platform comparison"
          subtitle="Reach, engagement & audience by channel"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[480px]">
          <div className="grid grid-cols-[1.4fr_1fr_1.6fr_1fr] gap-3 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Platform</span>
            <span className="text-right">Reach</span>
            <span>Engagement</span>
            <span className="text-right">Followers</span>
          </div>
          <ul className="divide-y divide-border">
            {platformComparison.map((p) => (
              <li
                key={p.platform}
                className="grid grid-cols-[1.4fr_1fr_1.6fr_1fr] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <PlatformBadge platform={p.platform} />
                <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {formatNumber(p.reach)}
                </span>
                <div className="flex items-center gap-2.5">
                  <Progress value={p.engagement * 10} className="h-1.5 flex-1" />
                  <span className="w-11 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                    {p.engagement}%
                  </span>
                </div>
                <span className="text-right text-sm font-medium tabular-nums text-muted-foreground">
                  {p.followers}
                </span>
              </li>
            ))}
          </ul>
          </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Top posts"
          subtitle="Highest-reaching content this period"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {analyticsTopPosts.map((post, i) => (
              <li
                key={post.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <span
                  className={
                    i < 3
                      ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-coral-500 text-xs font-bold tabular-nums text-white shadow-sm"
                      : "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground"
                  }
                >
                  {i + 1}
                </span>
                <PlatformChip platform={post.platform} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {post.title}
                </p>
                <div className="hidden shrink-0 items-center gap-6 text-right sm:flex">
                  <div className="w-14">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{post.reach}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Reach
                    </p>
                  </div>
                  <div className="w-12">
                    <p className="text-sm font-semibold tabular-nums text-emerald-600">{post.engagement}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Eng.
                    </p>
                  </div>
                  <div className="w-12">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{post.saves}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Saves
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Best posting times heatmap */}
      <ChartCard
        title="Best posting times"
        subtitle="When your audience is most active (local time)"
        action={
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span>Quiet</span>
            <span className="flex items-center gap-0.5">
              <span className="h-3 w-3 rounded-[4px] bg-muted/60" />
              <span className="h-3 w-3 rounded-[4px] bg-gradient-to-br from-brand-500 to-coral-500 opacity-50" />
              <span className="h-3 w-3 rounded-[4px] bg-gradient-to-br from-brand-500 to-coral-500 opacity-75" />
              <span className="h-3 w-3 rounded-[4px] bg-gradient-to-br from-brand-500 to-coral-500" />
            </span>
            <span>Most active</span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Hour labels */}
            <div className="mb-1.5 grid grid-cols-[44px_repeat(9,1fr)] gap-1.5">
              <span />
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="text-center text-[10px] font-medium text-muted-foreground"
                >
                  {hourLabel(h)}
                </span>
              ))}
            </div>
            {/* Day rows */}
            <div className="space-y-1.5">
              {bestPostingTimes.map((row) => (
                <div
                  key={row.day}
                  className="grid grid-cols-[44px_repeat(9,1fr)] items-center gap-1.5"
                >
                  <span className="text-xs font-semibold text-foreground">{row.day}</span>
                  {HOURS.map((h) => {
                    const active = row.hours.includes(h);
                    // Vary opacity by how "peak" the day is overall.
                    const intensity = row.hours.length / maxHoursPerDay;
                    return (
                      <div
                        key={h}
                        title={`${row.day} · ${hourLabel(h)} — ${active ? "active" : "quiet"}`}
                        className={
                          active
                            ? "h-7 rounded-md bg-gradient-to-br from-brand-500 to-coral-500 ring-1 ring-brand-300/40"
                            : "h-7 rounded-md bg-muted/60"
                        }
                        style={active ? { opacity: 0.55 + intensity * 0.45 } : undefined}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Key insights */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Key insights</h2>
          <span className="text-xs text-muted-foreground">Auto-generated from your data</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InsightCard
            tone="success"
            icon={<CalendarCheck className="h-4 w-4" />}
            title="Thursday is your best day"
            body="Thursdays drive the most active windows (4 peak hours). Front-load your highest-priority posts here for maximum reach."
            impact="Best day"
          />
          <InsightCard
            tone="brand"
            icon={<Rocket className="h-4 w-4" />}
            title="Reach is accelerating"
            body="Weekly reach climbed from 78K to 124K over 8 weeks — a 58.9% lift. Engagement rate is up to 6.8%, your highest yet."
            impact="Fastest growing"
          />
          <InsightCard
            tone="info"
            icon={<LayoutGrid className="h-4 w-4" />}
            title="Carousels outperform everything"
            body="Carousels lead at 8.9% engagement — nearly 2x your image posts. Shift more of your mix toward swipeable formats."
            impact="Top format"
          />
        </div>
      </div>
        </>
      ) : (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No analytics yet"
          description="Connect your accounts and start publishing — reach, engagement and top posts appear here once your data syncs."
        />
      )}
    </div>
  );
}
