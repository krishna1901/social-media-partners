"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  SearchX,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { CompetitorCard } from "@/components/ui/competitor-card";
import { ContentTypeBadge } from "@/components/ui/content-type-badge";
import { InsightCard } from "@/components/ui/insight-card";
import { SelectField } from "@/components/ui/select-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  createCompetitor,
  analyzeContentGapsAction,
  createIdeaFromGapAction,
} from "@/app/actions/competitors";
import type { listCompetitors, listCompetitorPosts } from "@/lib/db/competitors";
import type { ContentGap } from "@/lib/ai/types";

type CompetitorsViewProps = {
  competitors: Awaited<ReturnType<typeof listCompetitors>>;
  competitorPosts: Awaited<ReturnType<typeof listCompetitorPosts>>;
};

const statAccents: Record<string, { icon: React.ReactNode; accent: string }> = {
  tracked: { icon: <Users className="h-4 w-4" />, accent: "from-brand-500 to-coral-500" },
  cadence: { icon: <CalendarRange className="h-4 w-4" />, accent: "from-sky-500 to-blue-500" },
  niche: { icon: <Layers className="h-4 w-4" />, accent: "from-violet-500 to-indigo-500" },
  gaps: { icon: <Target className="h-4 w-4" />, accent: "from-amber-400 to-orange-500" },
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  youtube: "YouTube",
};

// Seed gaps shown until a fresh AI analysis is run (and the demo-mode view).
const INITIAL_GAPS: ContentGap[] = [
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

export function CompetitorsView({ competitors, competitorPosts }: CompetitorsViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [addError, setAddError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // AI content-gap analysis.
  const [gaps, setGaps] = useState<ContentGap[]>(INITIAL_GAPS);
  const [gapPending, startGapTransition] = useTransition();
  const [gapError, setGapError] = useState<string | null>(null);
  const [gapNote, setGapNote] = useState<string | null>(null);

  const handleAnalyzeGaps = () => {
    setGapError(null);
    setGapNote(null);
    startGapTransition(async () => {
      const res = await analyzeContentGapsAction();
      if (!res.ok) {
        setGapError(res.error);
        return;
      }
      setGaps(res.gaps);
      setGapNote(
        res.demo
          ? "Sample analysis — add an AI key for live, workspace-specific gaps."
          : "Refreshed with AI analysis of your tracked competitors."
      );
    });
  };

  const handleCreateFromGap = (gap: ContentGap) => {
    setGapError(null);
    setGapNote(null);
    startGapTransition(async () => {
      const res = await createIdeaFromGapAction({ title: gap.title, body: gap.body });
      if (!res.ok) {
        setGapError(res.error);
        return;
      }
      setGapNote(`Saved “${gap.title}” to Ideas.`);
    });
  };

  const avgPostsPerWeek = competitors.length
    ? Math.round(
        competitors.reduce((sum, c) => sum + c.postsPerWeek, 0) / competitors.length
      )
    : 0;

  // Most common niche across tracked competitors.
  const nicheCounts = competitors.reduce<Record<string, number>>((acc, c) => {
    acc[c.niche] = (acc[c.niche] ?? 0) + 1;
    return acc;
  }, {});
  const topNiche = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const nicheOptions = useMemo(
    () => [
      { value: "all", label: "All niches" },
      ...Array.from(new Set(competitors.map((c) => c.niche))).map((n) => ({ value: n, label: n })),
    ],
    [competitors]
  );

  const platformOptions = useMemo(
    () => [
      { value: "all", label: "All platforms" },
      ...Array.from(new Set(competitors.map((c) => c.platform))).map((p) => ({
        value: p,
        label: platformLabels[p] ?? p,
      })),
    ],
    [competitors]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return competitors.filter((c) => {
      if (niche !== "all" && c.niche !== niche) return false;
      if (platform !== "all" && c.platform !== platform) return false;
      if (q && !`${c.name} ${c.handle} ${c.niche}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, niche, platform, competitors]);

  const resetFilters = () => {
    setQuery("");
    setNiche("all");
    setPlatform("all");
  };

  const handleAddCompetitor = () => {
    setAddError(null);
    const name = window.prompt("Competitor name");
    if (!name || !name.trim()) return;
    startTransition(async () => {
      const result = await createCompetitor({ name: name.trim() });
      if (!result.ok) {
        setAddError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Competitor intelligence"
        title="Competitor Tracking"
        description="Benchmark rivals, study their best content, and find gaps."
        icon={<Target className="h-5 w-5" />}
        actions={
          <>
            <span className="hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" /> {gaps.length} gaps found
            </span>
            <Button
              onClick={handleAddCompetitor}
              disabled={pending}
              className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95"
            >
              <Plus className="h-4 w-4" /> Add competitor
            </Button>
          </>
        }
      />

      {addError && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {addError}
        </p>
      )}

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
          value={gaps.length}
          positive
          hint="AI-detected from rivals"
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
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() =>
                toast({
                  variant: "info",
                  title: "List management is coming soon",
                  description: "For now, add or remove competitors with the buttons above.",
                })
              }
            >
              Manage list
            </Button>
          }
        />

        {/* Filter bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search competitors by name, handle or niche…"
              className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <SelectField
              options={nicheOptions}
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full sm:w-44"
            />
            <SelectField
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No competitors match your filters"
            description="No tracked profiles fit this niche, platform or search. Clear the filters to see everyone — or add a new rival to benchmark against."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddCompetitor}
                  disabled={pending}
                  className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95"
                >
                  <Plus className="h-4 w-4" /> Add competitor
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <CompetitorCard
                key={c.id}
                competitor={c}
                className="h-full"
                onViewPosts={(comp) =>
                  toast({
                    variant: "info",
                    title: `Post breakdown coming soon`,
                    description: `A detailed post history for ${comp.name} will live here. See "What's working" below for highlights.`,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Top competitor posts — hook & format analysis */}
      <section className="space-y-4">
        <SectionHeader
          title="What's working for them"
          description="Hook & format breakdown of their best-performing posts"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {competitorPosts.map((p) => (
            <article
              key={p.id}
              className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-brand-200/70"
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

              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Heart className="h-3.5 w-3.5" /> {p.engagement} eng.
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{p.title}</span>
              </div>

              {/* Why it works — note / analysis */}
              <div className="mt-auto flex items-start gap-2 rounded-xl bg-muted/50 p-3">
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

      {/* Content gap suggestions — AI-generated */}
      <section className="space-y-4">
        <SectionHeader
          title="Content gap suggestions"
          description="Formats & angles your rivals win on that you haven't tried"
          icon={<Sparkles className="h-4 w-4 text-brand-500" />}
          action={
            <Button
              size="sm"
              onClick={handleAnalyzeGaps}
              disabled={gapPending}
              className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-95"
            >
              <Sparkles className={`h-3.5 w-3.5${gapPending ? " animate-pulse" : ""}`} />
              {gapPending ? "Analyzing…" : "Analyze with AI"}
            </Button>
          }
        />

        {(gapError || gapNote) && (
          <p
            className={`text-xs font-medium ${gapError ? "text-red-600" : "text-muted-foreground"}`}
            role={gapError ? "alert" : undefined}
          >
            {gapError ?? gapNote}
          </p>
        )}

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {gaps.map((g) => (
            <InsightCard
              key={g.id}
              title={g.title}
              body={g.body}
              tone={g.tone}
              impact={g.impact}
              icon={<Sparkles className="h-4 w-4" />}
              className="h-full"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateFromGap(g)}
                  disabled={gapPending}
                >
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
