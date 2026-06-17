/**
 * Phase 3A — AI content generation types.
 *
 * Shared across the (server-only) provider layer, the prompt builder, the data
 * layer, and the server actions. No runtime imports here so it is safe to pull
 * into both server and client modules for typing.
 */

/** Supported AI providers (dependency-free REST calls under the hood). */
export type AIProvider = "openai" | "anthropic";

/** The 10 Content Studio tools (ids mirror `studioTools` in demo-data), plus
 * the competitor "content gap" analysis (Phase 6). */
export type AIToolId =
  | "hook"
  | "caption"
  | "hashtag"
  | "cta"
  | "carousel"
  | "video-script"
  | "linkedin"
  | "instagram"
  | "repurpose"
  | "brief"
  | "gap-analysis";

/** Run status persisted on every generation. */
export type AIGenerationStatus = "success" | "demo" | "failed";

/** User-supplied generation inputs from the Content Studio form. */
export interface AIGenerateInput {
  tool: AIToolId;
  topic: string;
  audience?: string;
  platform?: string;
  tone?: string;
  contentType?: string;
  context?: string;
}

/**
 * Result of a generation attempt. `generateAI` NEVER throws — failures come
 * back as `{ ok: false, status: "failed", error }` so the UI can render an
 * inline error without crashing the page/build.
 */
export interface AIGenerateResult {
  ok: boolean;
  /** Full generated text (variations joined / structured copy). */
  output: string;
  /** Individual variations when the tool produces a list (else single entry). */
  variations: string[];
  /** True when this is canned demo output (no API key configured). */
  demo: boolean;
  provider: AIProvider | null;
  model: string | null;
  status: AIGenerationStatus;
  error?: string;
}

/**
 * A single competitor content-gap suggestion (Phase 6). Parsed from the
 * `gap-analysis` tool output; `tone` drives the InsightCard styling.
 */
export interface ContentGap {
  id: string;
  title: string;
  body: string;
  impact: string;
  tone: "brand" | "warning" | "success";
}
