"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Plus, X, Radar, TrendingUp, Flame, Target, Tag } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ChartCard } from "@/components/ui/chart-card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendCard } from "@/components/ui/trend-card";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trends, trendCategories } from "@/lib/demo-data";

const SEED_KEYWORDS = ["AI agents", "faceless", "hooks", "UGC", "build in public", "short docs"];

export default function TrendsPage() {
  const [niche, setNiche] = useState("All niches");
  const [keywords, setKeywords] = useState<string[]>(SEED_KEYWORDS);
  const [draft, setDraft] = useState("");

  const filtered = useMemo(
    () => (niche === "All niches" ? trends : trends.filter((t) => t.category === niche)),
    [niche]
  );

  const risingCount = trends.filter((t) => t.momentum === "rising").length;
  const avgRelevance = Math.round(
    trends.reduce((sum, t) => sum + t.relevance, 0) / trends.length
  );

  const addKeyword = () => {
    const value = draft.trim();
    if (!value || keywords.some((k) => k.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setKeywords((prev) => [...prev, value]);
    setDraft("");
  };

  const removeKeyword = (kw: string) =>
    setKeywords((prev) => prev.filter((k) => k !== kw));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trend Radar"
        title="Spot what's next"
        description="AI-surfaced trends and keywords in your niche."
        icon={<Radar className="h-5 w-5" />}
        actions={
          <>
            <SelectField
              options={trendCategories}
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-44"
            />
            <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:opacity-90">
              <RefreshCw className="h-4 w-4" /> Refresh trends
            </Button>
          </>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Trends tracked"
          value={trends.length}
          hint="across your niches"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="from-brand-500 to-coral-500"
        />
        <StatCard
          label="Rising now"
          value={risingCount}
          delta="hot"
          positive
          hint="accelerating fast"
          icon={<Flame className="h-4 w-4" />}
          accent="from-amber-400 to-orange-500"
        />
        <StatCard
          label="Avg relevance"
          value={`${avgRelevance}/100`}
          hint="match to your brand"
          icon={<Target className="h-4 w-4" />}
          accent="from-violet-500 to-indigo-500"
        />
        <StatCard
          label="Keywords watched"
          value={keywords.length}
          hint="in your tracker"
          icon={<Tag className="h-4 w-4" />}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Keyword tracker */}
      <ChartCard
        title="Keyword tracker"
        subtitle="Get alerted when these terms spike in your niche"
        action={
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {keywords.length} tracked
          </span>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Add a keyword to watch…"
              className="h-9"
            />
            <Button onClick={addKeyword} disabled={!draft.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-sm font-medium text-foreground"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    aria-label={`Remove ${kw}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No keywords yet — add a term above to start tracking spikes.
            </p>
          )}
        </div>
      </ChartCard>

      {/* Trends grid */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {niche === "All niches" ? "All trends" : niche}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} trend{filtered.length === 1 ? "" : "s"} surfaced
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TrendCard key={t.id} trend={t} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Radar className="h-6 w-6" />}
          title="No trends in this niche yet"
          description="Try a different niche or refresh to pull the latest signals from across platforms."
          action={
            <Button variant="outline" onClick={() => setNiche("All niches")}>
              <RefreshCw className="h-4 w-4" /> Show all niches
            </Button>
          }
        />
      )}
    </div>
  );
}
