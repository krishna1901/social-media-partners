import {
  Plus,
  Users,
  CalendarRange,
  Layers,
  Target,
  Sparkles,
  Quote,
  Heart,
  Lightbulb,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { CompetitorCard } from "@/components/ui/competitor-card";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { InsightCard } from "@/components/ui/insight-card";
import { Button } from "@/components/ui/button";
import { competitors, competitorPosts } from "@/lib/demo-data";

const statAccents: Record<string, { icon: React.ReactNode; accent: string }> = {
  tracked: { icon: <Users className="h-4 w-4" />, accent: "from-brand-500 to-coral-500" },
  cadence: { icon: <CalendarRange className="h-4 w-4" />, accent: "from-sky-500 to-blue-500" },
  niche: { icon: <Layers className="h-4 w-4" />, accent: "from-violet-500 to-indigo-500" },
  gaps: { icon: <Target className="h-4 w-4" />, accent: "from-amber-400 to-orange-500" },
};

// AI-detected content-gap suggestions (placeholder — defined inline).
const contentGaps: {
  id: string;
  title: string;
  body: string;
  tone: "brand" | "warning" | "success";
  impact: string;
}[] = [
  {
    id: "g1",
    title: "You're missing short documentaries",
    body: "Founder Diaries pulls 6.7% engagement on short-doc storytelling — a format you haven't published yet. One 3–5 min mini-doc per month could close the gap.",
    tone: "brand",
    impact: "High impact",
  },
  {
    id: "g2",
    title: "Add a weekly hot-take thread",
    body: "AI Daily posts 21x/week and leans on opinionated threads. You publish zero text threads — a recurring Monday hot-take would test a proven, low-effort format.",
    tone: "warning",
    impact: "Quick win",
  },
  {
    id: "g3",
    title: "Try save-bait framework carousels",
    body: "Growth Lab's 'B2B content matrix' carousel earns 5.2% by packaging a framework as save-bait. Mirror the angle with your own repeatable system.",
    tone: "success",
    impact: "Medium impact",
  },
];

export default function CompetitorsPage() {
  const avgPostsPerWeek = Math.round(
    competitors.reduce((sum, c) => sum + c.postsPerWeek, 0) / competitors.length
  );

  // Most common niche across tracked competitors.
  const nicheCounts = competitors.reduce<Record<string, number>>((acc, c) => {
    acc[c.niche] = (acc[c.niche] ?? 0) + 1;
    return acc;
  }, {});
  const topNiche = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Competitor Tracking"
        description="Benchmark rivals, study their best content, and find gaps."
        actions={
          <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95">
            <Plus className="h-4 w-4" /> Add competitor
          </Button>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Tracked competitors"
          value={competitors.length}
          delta="+1"
          positive
          hint="across 4 platforms"
          icon={statAccents.tracked.icon}
          accent={statAccents.tracked.accent}
        />
        <StatCard
          label="Avg posts / week"
          value={avgPostsPerWeek}
          delta="+2"
          positive
          hint="competitor cadence"
          icon={statAccents.cadence.icon}
          accent={statAccents.cadence.accent}
        />
        <StatCard
          label="Top niche"
          value={topNiche}
          hint="most-tracked space"
          icon={statAccents.niche.icon}
          accent={statAccents.niche.accent}
        />
        <StatCard
          label="Content gaps found"
          value={5}
          delta="+3"
          positive
          hint="AI-detected this week"
          icon={statAccents.gaps.icon}
          accent={statAccents.gaps.accent}
        />
      </div>

      {/* Tracked competitors */}
      <section className="space-y-4">
        <SectionHeader
          title="Tracked competitors"
          description="Profiles you're benchmarking against"
          icon={<Users className="h-4 w-4" />}
          action={
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Manage list
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} />
          ))}
        </div>
      </section>

      {/* Top competitor posts — hook & format analysis */}
      <section className="space-y-4">
        <SectionHeader
          title="What's working for them"
          description="Hook & format breakdown of their best-performing posts"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {competitorPosts.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{p.competitor}</span>
                <ContentTypeBadge type={p.format} />
              </div>

              {/* Hook analysis — the quoted, emphasized opening line */}
              <div className="relative rounded-xl bg-gradient-to-br from-brand-50 to-coral-50 p-4 ring-1 ring-brand-100">
                <Quote className="absolute right-3 top-3 h-4 w-4 text-brand-300" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                  Hook
                </p>
                <p className="mt-1 pr-5 text-sm font-medium italic leading-relaxed text-foreground">
                  &ldquo;{p.hook}&rdquo;
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Heart className="h-3.5 w-3.5" /> {p.engagement} eng.
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{p.title}</span>
              </div>

              {/* Why it works — note / analysis */}
              <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Why it works
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{p.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Content gap suggestions — AI placeholder */}
      <section className="space-y-4">
        <SectionHeader
          title="Content gap suggestions"
          description="Formats & angles your rivals win on that you haven't tried"
          icon={<Sparkles className="h-4 w-4 text-brand-500" />}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              <Sparkles className="h-3 w-3" /> AI suggestions
            </span>
          }
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {contentGaps.map((g) => (
            <InsightCard
              key={g.id}
              title={g.title}
              body={g.body}
              tone={g.tone}
              impact={g.impact}
              icon={<Sparkles className="h-4 w-4" />}
              action={
                <Button variant="outline" size="sm">
                  Create from gap
                </Button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
