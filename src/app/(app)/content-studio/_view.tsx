"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  History,
  Bookmark,
  Send,
  Wand2,
  LayoutTemplate,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ChartCard } from "@/components/ui/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard } from "@/components/ui/tool-card";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  studioTools,
  studioToneOptions,
  studioContentTypes,
} from "@/lib/demo-data";
import {
  generateContentAction,
  saveGenerationAsIdea,
  convertGenerationToPost,
} from "@/app/actions/ai";
import type { AIGenerateResult, AIToolId } from "@/lib/ai/types";
import type { RecentGeneration } from "@/lib/db/ai-generations";
import { VariationCard } from "./_components/variation-card";

type Status = "idle" | "loading" | "done" | "error";

const platformOptions = ["Instagram", "LinkedIn", "TikTok", "YouTube", "X", "Facebook"];
const templateChips = [
  "Product launch thread",
  "Founder story",
  "Listicle carousel",
  "Hot take",
  "Case study",
];

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function ContentStudioView({
  recent,
  aiConfigured,
}: {
  recent: RecentGeneration[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  // Surfaces a "coming soon" notice for the generation-history views.
  const comingSoon = () =>
    toast({
      variant: "info",
      title: "Generation history is coming soon",
      description: "Your recent generations already appear in the side panel for quick reuse.",
    });

  const [activeTool, setActiveTool] = useState<AIToolId>("hook");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AIGenerateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Form state (controlled).
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState(platformOptions[0]);
  const [tone, setTone] = useState(studioToneOptions[2]);
  const [contentType, setContentType] = useState(studioContentTypes[0]);
  const [context, setContext] = useState("");

  const [isGenerating, startGenerate] = useTransition();
  const [isActing, startAction] = useTransition();

  const tool = studioTools.find((t) => t.id === activeTool) ?? studioTools[0];

  function runGenerate() {
    setFeedback(null);
    setErrorMsg(null);
    if (!topic.trim()) {
      setStatus("error");
      setErrorMsg("Add a topic to generate content.");
      return;
    }
    setStatus("loading");
    startGenerate(async () => {
      const res = await generateContentAction({
        tool: activeTool,
        topic,
        audience: audience || undefined,
        platform,
        tone,
        contentType,
        context: context || undefined,
      });
      setResult(res);
      if (res.status === "failed") {
        setStatus("error");
        setErrorMsg(res.error ?? "Generation failed. Please try again.");
      } else {
        setStatus("done");
        router.refresh();
      }
    });
  }

  async function handleCopyAll() {
    if (!result) return;
    try {
      await navigator.clipboard?.writeText(result.output);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  function handleSaveAsIdea() {
    if (!result) return;
    setFeedback(null);
    startAction(async () => {
      const res = await saveGenerationAsIdea({
        tool: activeTool,
        topic,
        output: result.output,
      });
      if (res.ok) {
        setFeedback({ type: "success", message: "Saved to your ideas backlog." });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handleConvertToPost() {
    if (!result) return;
    setFeedback(null);
    startAction(async () => {
      const res = await convertGenerationToPost({
        tool: activeTool,
        topic,
        platform,
        output: result.output,
      });
      if (res.ok) {
        setFeedback({ type: "success", message: "Draft post created." });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  /** Load a past generation from the recent list into the preview. */
  function loadRecent(g: RecentGeneration) {
    setResult({
      ok: true,
      output: g.output,
      variations: [g.output],
      demo: false,
      provider: null,
      model: null,
      status: "success",
    });
    setStatus("done");
    setFeedback(null);
    setErrorMsg(null);
  }

  const variations = result?.variations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Tools"
        title="Content Studio"
        description="Generate on-brand content with AI — hooks, captions, hashtags, scripts and more."
        icon={<Wand2 className="h-5 w-5" />}
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="tabular-nums">1,240</span> credits left
            </span>
            <Button variant="ghost" onClick={comingSoon}>
              <History className="h-4 w-4" /> View history
            </Button>
          </>
        }
      />

      {/* Demo-mode notice (no real provider key configured) */}
      {!aiConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <span className="font-semibold">Demo mode.</span> No AI provider key is
            configured, so generations return realistic sample output. Add{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-medium">
              OPENAI_API_KEY
            </code>{" "}
            or{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-medium">
              ANTHROPIC_API_KEY
            </code>{" "}
            to generate live content.
          </p>
        </div>
      )}

      {/* Tool picker */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Choose a tool</h2>
            <p className="text-xs text-muted-foreground">
              {studioTools.length} generators tuned for every platform and format
            </p>
          </div>
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            Selected: <span className="font-semibold text-brand-600">{tool.name}</span>
          </span>
        </div>
        <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
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
                setActiveTool(t.id as AIToolId);
                setStatus("idle");
                setResult(null);
                setFeedback(null);
                setErrorMsg(null);
              }}
            />
          ))}
        </div>
      </section>

      {/* Split-panel workspace */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT — config */}
        <ChartCard
          title={tool.name}
          subtitle={tool.desc}
          className="lg:col-span-4"
          footer={
            <span className="flex items-center justify-between">
              <span>Each generation uses ~4 credits</span>
              <span className="font-semibold text-foreground tabular-nums">1,240 left</span>
            </span>
          }
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="topic">Topic</Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">{topic.length}/120</span>
              </div>
              <Input
                id="topic"
                value={topic}
                maxLength={120}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why faceless content is exploding in 2026"
              />
              <p className="text-[11px] text-muted-foreground">What should this content be about?</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="audience">Audience</Label>
              <Input
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Solo marketers & creators"
              />
              <p className="text-[11px] text-muted-foreground">Who you&apos;re writing for — shapes voice and references.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="platform">Platform</Label>
                <SelectField
                  id="platform"
                  options={platformOptions}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tone">Tone</Label>
                <SelectField
                  id="tone"
                  options={studioToneOptions}
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content-type">Content format</Label>
              <SelectField
                id="content-type"
                options={studioContentTypes}
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Optimizes length and structure for the format.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="context">Additional context</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Optional — key points, offers, links, or brand notes to weave in."
                className="min-h-20"
              />
            </div>

            <Button
              onClick={runGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-gradient-to-r from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20 hover:from-brand-600 hover:to-coral-600"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating…" : "Generate"}
            </Button>
          </div>
        </ChartCard>

        {/* MIDDLE — output preview */}
        <ChartCard
          title="Output preview"
          subtitle={
            status === "done" && variations.length
              ? `${variations.length} ${variations.length === 1 ? "result" : "variations"}`
              : undefined
          }
          className="lg:col-span-5"
          action={
            status === "done" ? (
              <Button variant="ghost" size="sm" onClick={runGenerate} disabled={isGenerating}>
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
                  onClick={runGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:from-brand-600 hover:to-coral-600"
                >
                  <Sparkles className="h-4 w-4" /> Generate
                </Button>
              }
            />
          )}

          {status === "loading" && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-500" />
                Generating on-brand content…
              </p>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-6 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6" />}
              title="Couldn't generate that"
              description={errorMsg ?? "Something went wrong. Please try again."}
              action={
                <Button variant="outline" onClick={runGenerate} disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              }
            />
          )}

          {status === "done" && result && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Generated{" "}
                <span className="font-semibold text-foreground">{variations.length}</span>{" "}
                {variations.length === 1 ? "result" : "variations"} for{" "}
                <span className="font-semibold text-foreground">{tool.name}</span>
                {result.demo ? " (sample output)" : ""}. Copy one or convert straight into a post.
              </p>

              <div className="space-y-3">
                {variations.map((text, i) => (
                  <VariationCard key={i} text={text} index={i} />
                ))}
              </div>

              {feedback && (
                <p
                  className={
                    feedback.type === "success"
                      ? "text-xs font-medium text-emerald-600"
                      : "text-xs font-medium text-destructive"
                  }
                >
                  {feedback.message}
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  onClick={handleConvertToPost}
                  disabled={isActing}
                  className="bg-gradient-to-r from-brand-500 to-coral-500 text-white hover:from-brand-600 hover:to-coral-600"
                >
                  <Send className="h-4 w-4" /> Convert to post
                </Button>
                <Button variant="outline" onClick={handleSaveAsIdea} disabled={isActing}>
                  <Bookmark className="h-4 w-4" /> Save as idea
                </Button>
                <Button variant="ghost" onClick={handleCopyAll}>
                  {copiedAll ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copiedAll ? "Copied" : "Copy all"}
                </Button>
                <Button variant="ghost" className="ml-auto" onClick={runGenerate} disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </ChartCard>

        {/* RIGHT — side panel */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <ChartCard
            title="Recent generations"
            action={
              <button
                type="button"
                onClick={comingSoon}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                View all
              </button>
            }
            bodyClassName="p-0"
          >
            {recent.length === 0 ? (
              <div className="px-4 py-8">
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="No generations yet"
                  description="Your AI generations will show up here for quick reuse."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => loadRecent(g)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{g.toolName}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{g.preview}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{g.time}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>

          <ChartCard title="Templates" subtitle="Start from a proven format">
            <div className="flex flex-col gap-1.5">
              {templateChips.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                >
                  <span className="inline-flex items-center gap-2">
                    <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand-500" />
                    {t}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
