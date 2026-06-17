"use server";

import { revalidatePath } from "next/cache";
import {
  createCompetitor as dbCreateCompetitor,
  updateCompetitor as dbUpdateCompetitor,
  archiveCompetitor as dbArchiveCompetitor,
  deleteCompetitor as dbDeleteCompetitor,
  addCompetitorPost as dbAddCompetitorPost,
  listCompetitors,
  listCompetitorPosts,
  type CreateCompetitorInput,
  type CompetitorPostInput,
  type MappedCompetitor,
  type MappedCompetitorPost,
} from "@/lib/db/competitors";
import { generateAI } from "@/lib/ai/generate";
import { buildPrompt, PROMPT_VERSION } from "@/lib/ai/prompts";
import { createGeneration } from "@/lib/db/ai-generations";
import { checkAiQuota } from "@/lib/billing/usage";
import { createIdea as dbCreateIdea } from "@/lib/db/ideas";
import type { ContentGap } from "@/lib/ai/types";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function revalidateCompetitors(): void {
  revalidatePath("/competitors");
}

export async function createCompetitor(
  input: CreateCompetitorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const competitor = await dbCreateCompetitor(input);
    revalidateCompetitors();
    return { ok: true, id: competitor.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateCompetitor(
  id: string,
  input: Partial<CreateCompetitorInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    const competitor = await dbUpdateCompetitor(id, input);
    revalidateCompetitors();
    return { ok: true, id: competitor.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function archiveCompetitor(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const competitor = await dbArchiveCompetitor(id);
    revalidateCompetitors();
    return { ok: true, id: competitor.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteCompetitor(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deletedId = await dbDeleteCompetitor(id);
    revalidateCompetitors();
    return { ok: true, id: deletedId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function addCompetitorPost(
  competitorId: string,
  input: CompetitorPostInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await dbAddCompetitorPost(competitorId, input);
    revalidateCompetitors();
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Build the competitor brief fed to the gap-analysis prompt. */
function buildGapContext(
  competitors: MappedCompetitor[],
  posts: MappedCompetitorPost[]
): string {
  const compLines = competitors.map(
    (c) =>
      `- ${c.name} (${c.platform}, ${c.niche || "general"}): ${c.postsPerWeek} posts/week, ` +
      `${c.avgEngagement} eng, top format ${c.topFormat}`
  );
  const postLines = posts.map(
    (p) => `- ${p.competitor} [${p.format}, ${p.engagement}]: "${p.hook}" — ${p.note}`
  );
  return [
    "Tracked competitors:",
    ...compLines,
    "",
    "Their best-performing posts:",
    ...(postLines.length ? postLines : ["(none recorded yet)"]),
  ].join("\n");
}

/** Map the impact label to an InsightCard tone. */
function toneForImpact(impact: string): ContentGap["tone"] {
  const i = impact.toLowerCase();
  if (i.includes("high")) return "brand";
  if (i.includes("quick")) return "warning";
  return "success";
}

/** Parse `Title :: rationale :: Impact: X` lines into structured gaps. */
function parseGaps(variations: string[]): ContentGap[] {
  return variations
    .map((raw) => raw.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((raw, idx) => {
      const parts = raw.split("::").map((s) => s.trim()).filter(Boolean);
      const title = parts.length > 1 ? parts[0] : "Content gap";
      const body = parts.length > 1 ? parts[1] : parts[0] ?? raw;
      const impact = (parts[2] ?? "").replace(/^impact:\s*/i, "").trim() || "Idea";
      return { id: `gap-${idx + 1}`, title, body, impact, tone: toneForImpact(impact) };
    });
}

type GapResult =
  | { ok: true; gaps: ContentGap[]; demo: boolean }
  | { ok: false; error: string };

/**
 * Run an AI content-gap analysis over the workspace's tracked competitors.
 * Reuses the Content Studio AI infra (quota-enforced, logged to ai_generations).
 * Works in demo mode (canned output) and never throws.
 */
export async function analyzeContentGapsAction(): Promise<GapResult> {
  const quota = await checkAiQuota();
  if (!quota.allowed) {
    return {
      ok: false,
      error: `Monthly AI limit reached (${quota.used}/${quota.limit}). Upgrade your plan for more.`,
    };
  }

  const [competitors, posts] = await Promise.all([listCompetitors(), listCompetitorPosts()]);
  if (competitors.length === 0) {
    return { ok: false, error: "Add a competitor first so AI has something to analyze." };
  }

  const input = {
    tool: "gap-analysis" as const,
    topic: "Content gaps vs my tracked competitors",
    context: buildGapContext(competitors, posts),
  };

  const result = await generateAI(input);

  // Best-effort logging (live workspaces only) — counts toward the AI quota.
  await createGeneration({
    tool: "gap-analysis",
    prompt: buildPrompt(input).user,
    output: result.output,
    input,
    outputJson: { variations: result.variations },
    provider: result.provider,
    model: result.model,
    status: result.status,
    promptVersion: PROMPT_VERSION,
    errorMessage: result.error ?? null,
  });

  if (!result.ok) return { ok: false, error: result.error ?? "Gap analysis failed." };
  return { ok: true, gaps: parseGaps(result.variations), demo: result.demo };
}

/** Save a content gap as a draft idea in the backlog. */
export async function createIdeaFromGapAction(args: {
  title: string;
  body: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const idea = await dbCreateIdea({
      title: args.title.trim() || "Content gap idea",
      category: "Competitor gap",
      content_type: "text",
      notes: args.body,
    });
    revalidatePath("/ideas");
    return { ok: true, id: idea.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
