import Link from "next/link";
import {
  PenSquare,
  FileText,
  CalendarDays,
  Sparkles,
  Inbox,
  TrendingUp,
  Flame,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { InsightCard } from "@/components/ui/insight-card";
import { ActivityFeed } from "@/components/ui/activity-feed";
import { QuickActions } from "@/components/ui/quick-actions";
import { PlatformChip } from "@/components/ui/platform-badge";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { Button } from "@/components/ui/button";
import {
  currentUser,
  dashboardStats,
  weeklyPerformance,
  platformBreakdown,
  engagementTrend,
  contentTypePerformance,
  recentDrafts,
  upcomingPosts,
  trendingNow,
  recentGenerations,
  activityFeed,
  smartRecommendations,
} from "@/lib/demo-data";

const statMeta: Record<string, { icon: React.ReactNode; accent: string }> = {
  "total-posts": { icon: <PenSquare className="h-4 w-4" />, accent: "from-brand-500 to-coral-500" },
  drafts: { icon: <FileText className="h-4 w-4" />, accent: "from-slate-500 to-slate-700" },
  scheduled: { icon: <CalendarDays className="h-4 w-4" />, accent: "from-amber-400 to-orange-500" },
  "ai-generated": { icon: <Sparkles className="h-4 w-4" />, accent: "from-violet-500 to-indigo-500" },
  inbox: { icon: <Inbox className="h-4 w-4" />, accent: "from-sky-500 to-blue-500" },
  engagement: { icon: <TrendingUp className="h-4 w-4" />, accent: "from-emerald-500 to-teal-500" },
};

const recIcon: Record<string, React.ReactNode> = {
  trend: <TrendingUp className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  inbox: <Inbox className="h-4 w-4" />,
};
const recTone: Record<string, "brand" | "warning" | "success"> = { r1: "brand", r2: "warning", r3: "success" };

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-sidebar p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-56 w-56 rounded-full bg-coral-500/20 blur-3xl" />
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/50">{today}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {currentUser.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/70">
              You have <span className="font-semibold text-white">3 posts scheduled</span> today,{" "}
              <span className="font-semibold text-white">23 unread messages</span>, and{" "}
              <span className="font-semibold text-white">4 AI drafts</span> ready to review.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/posts/new">
                <Button className="bg-white text-sidebar hover:bg-white/90">
                  <PenSquare className="h-4 w-4" /> Create post
                </Button>
              </Link>
              <Link href="/content-studio">
                <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Sparkles className="h-4 w-4" /> Generate with AI
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            {[
              { label: "Today's reach", value: "18.4K", trend: "+12%" },
              { label: "Posts live", value: "7", trend: "+3" },
              { label: "Eng. rate", value: "6.8%", trend: "+0.9%" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-medium text-white/50">{s.label}</p>
                <p className="mt-1 text-xl font-bold">{s.value}</p>
                <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-300">
                  <ArrowUpRight className="h-3 w-3" /> {s.trend}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {dashboardStats.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            delta={s.delta}
            positive={s.positive}
            hint={s.hint}
            icon={statMeta[s.key]?.icon}
            accent={statMeta[s.key]?.accent}
          />
        ))}
      </div>

      {/* Performance + platform breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Weekly Content Performance"
          subtitle="Posts published per day this week"
          className="lg:col-span-2"
          action={<span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">+18% vs last week</span>}
          footer={<span>65 posts published · 38.2K total engagements this week</span>}
        >
          <BarChart data={weeklyPerformance.map((d) => ({ label: d.label, value: d.published }))} showValues height={200} />
        </ChartCard>

        <ChartCard title="Platform Breakdown" subtitle="Share of published content">
          <DonutChart data={platformBreakdown} centerLabel="1,284" centerSublabel="Total posts" size={150} />
        </ChartCard>
      </div>

      {/* Engagement trend + content type + recommendations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Engagement Trend" subtitle="8-week engagement rate (%)">
          <AreaChart data={engagementTrend} height={200} valueFormatter={(n) => `${n}%`} />
        </ChartCard>

        <ChartCard title="Content Type Performance" subtitle="Avg. engagement rate by format">
          <BarChart
            data={contentTypePerformance}
            height={200}
            showValues
            valueFormatter={(n) => `${n}%`}
            barClassName="from-violet-500 to-indigo-400 group-hover:from-violet-600 group-hover:to-indigo-500"
          />
        </ChartCard>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Smart Recommendations</h2>
            <Sparkles className="h-4 w-4 text-brand-500" />
          </div>
          {smartRecommendations.map((r) => (
            <InsightCard
              key={r.id}
              title={r.title}
              body={r.body}
              impact={r.impact}
              tone={recTone[r.id]}
              icon={recIcon[r.icon]}
            />
          ))}
        </div>
      </div>

      {/* Drafts / Upcoming / Trending */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Recent Drafts"
          action={<Link href="/posts" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {recentDrafts.map((d) => (
              <li key={d.id}>
                <Link href="/posts" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                  <PlatformChip platform={d.platform} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">Updated {d.updated}</p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">{d.score}</span>
                </Link>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Upcoming Scheduled"
          action={<Link href="/calendar" className="text-xs font-semibold text-brand-600 hover:underline">Calendar</Link>}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {upcomingPosts.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{u.title}</p>
                  <p className="text-[11px] text-muted-foreground">{u.when}</p>
                </div>
                <ContentTypeBadge type={u.type} />
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Trending Now"
          action={<Link href="/trends" className="text-xs font-semibold text-brand-600 hover:underline">Trend radar</Link>}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {trendingNow.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 text-white">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{t.tag}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <PlatformChip platform={t.platform} className="h-4 w-4 border-0 bg-transparent p-0" />
                    Relevance {t.score}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">{t.growth}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Quick actions / AI generations / Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Quick Actions" subtitle="Jump back into your workflow">
          <QuickActions />
        </ChartCard>

        <ChartCard
          title="Recent AI Generations"
          action={<Link href="/content-studio" className="text-xs font-semibold text-brand-600 hover:underline">Studio</Link>}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {recentGenerations.map((g) => (
              <li key={g.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{g.tool}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{g.preview}</p>
                  <p className="text-[11px] text-muted-foreground/70">{g.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Activity Feed">
          <ActivityFeed items={activityFeed} />
        </ChartCard>
      </div>
    </div>
  );
}
