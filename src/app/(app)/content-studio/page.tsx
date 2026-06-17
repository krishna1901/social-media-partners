"use client";

import { useState } from "react";
import {
  Sparkles,
  Copy,
  RefreshCw,
  History,
  Bookmark,
  Send,
  Wand2,
  LayoutTemplate,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ChartCard } from "@/components/ui/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard } from "@/components/ui/tool-card";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  studioTools,
  studioToneOptions,
  studioContentTypes,
  sampleGeneratedHooks,
  recentGenerations,
} from "@/lib/demo-data";

type Status = "idle" | "loading" | "done";

const platformOptions = ["Instagram", "LinkedIn", "TikTok", "YouTube", "X", "Facebook"];
const templateChips = [
  "Product launch thread",
  "Founder story",
  "Listicle carousel",
  "Hot take",
  "Case study",
];

export default function ContentStudioPage() {
  const [activeTool, setActiveTool] = useState("hook");
  const [status, setStatus] = useState<Status>("idle");
  const [topic, setTopic] = useState("");

  const tool = studioTools.find((t) => t.id === activeTool) ?? studioTools[0];

  function handleGenerate() {
    setStatus("loading");
    setTimeout(() => setStatus("done"), 900);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Tools"
        title="Content Studio"
        description="Generate on-brand content with AI — hooks, captions, hashtags, scripts and more."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600">
              <Sparkles className="h-3.5 w-3.5" /> 1,240 AI credits
            </span>
            <Button variant="ghost">
              <History className="h-4 w-4" /> View history
            </Button>
          </>
        }
      />

      {/* Tool picker */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {studioTools.map((t) => (
          <ToolCard
            key={t.id}
            name={t.name}
            desc={t.desc}
            icon={t.icon}
            color={t.color}
            tag={t.tag || undefined}
            selected={activeTool === t.id}
            onClick={() => {
              setActiveTool(t.id);
              setStatus("idle");
            }}
          />
        ))}
      </div>

      {/* Split-panel workspace */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT — config */}
        <ChartCard
          title={tool.name}
          subtitle="Configure your generation"
          className="lg:col-span-4"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why faceless content is exploding in 2026"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" placeholder="e.g. Solo marketers & creators" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="platform">Platform</Label>
              <SelectField id="platform" options={platformOptions} defaultValue="Instagram" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tone">Tone</Label>
              <SelectField id="tone" options={studioToneOptions} defaultValue={studioToneOptions[2]} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-type">Content type</Label>
              <SelectField id="content-type" options={studioContentTypes} defaultValue={studioContentTypes[0]} />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={status === "loading"}
              className="w-full bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:from-brand-600 hover:to-coral-600"
            >
              <Sparkles className="h-4 w-4" />
              {status === "loading" ? "Generating…" : "Generate"}
            </Button>
          </div>
        </ChartCard>

        {/* MIDDLE — output preview */}
        <ChartCard
          title="Output preview"
          subtitle={status === "done" ? `${sampleGeneratedHooks.length} variations` : undefined}
          className="lg:col-span-5"
          action={
            status === "done" ? (
              <Button variant="ghost" size="sm" onClick={handleGenerate}>
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
            ) : undefined
          }
        >
          {status === "idle" && (
            <EmptyState
              icon={<Wand2 className="h-6 w-6" />}
              title="Nothing generated yet"
              description="Set a topic, audience, tone and platform on the left, then hit Generate to see on-brand variations here."
              action={
                <Button
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:from-brand-600 hover:to-coral-600"
                >
                  <Sparkles className="h-4 w-4" /> Generate
                </Button>
              }
            />
          )}

          {status === "loading" && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-6 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          )}

          {status === "done" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {sampleGeneratedHooks.map((hook, i) => (
                  <div
                    key={i}
                    className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand-200 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                        <Sparkles className="h-3 w-3" /> Variation {i + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Copy variation ${i + 1}`}
                        className="text-muted-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{hook}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button variant="outline">
                  <Bookmark className="h-4 w-4" /> Save as idea
                </Button>
                <Button className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:from-brand-600 hover:to-coral-600">
                  <Send className="h-4 w-4" /> Convert to post
                </Button>
                <Button variant="ghost" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
                <Button variant="ghost">
                  <Copy className="h-4 w-4" /> Copy all
                </Button>
              </div>
            </div>
          )}
        </ChartCard>

        {/* RIGHT — side panel */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <ChartCard title="Recent generations" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {recentGenerations.map((g) => (
                <li key={g.id} className="flex items-start gap-3 px-4 py-3">
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

          <ChartCard title="Templates" subtitle="Start from a proven format">
            <div className="flex flex-wrap gap-2">
              {templateChips.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" /> {t}
                </button>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
