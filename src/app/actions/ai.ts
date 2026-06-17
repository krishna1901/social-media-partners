"use server";

import { revalidatePath } from "next/cache";
import { generateAI } from "@/lib/ai/generate";
import { buildPrompt, PROMPT_VERSION, toolLabel } from "@/lib/ai/prompts";
import { createGeneration } from "@/lib/db/ai-generations";
import { checkAiQuota } from "@/lib/billing/usage";
import { createIdea as dbCreateIdea } from "@/lib/db/ideas";
import { createPost as dbCreatePost } from "@/lib/db/posts";
import type { AIGenerateInput, AIGenerateResult, AIToolId } from "@/lib/ai/types";
import type { PostType } from "@/lib/db/types";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

/** Map a Content Studio tool to the closest post/idea content type. */
function contentTypeForTool(tool: AIToolId): PostType {
  if (tool === "carousel") return "carousel";
  if (tool === "video-script") return "video";
  return "text";
}

/**
 * Generate content for a Content Studio tool, then persist the run (live
 * workspaces only — best-effort). Returns the full result; `generateAI` never
 * throws, so failures arrive as `{ status: "failed", error }`.
 */
export async function generateContentAction(
  input: AIGenerateInput
): Promise<AIGenerateResult> {
  const topic = input.topic?.trim();
  if (!topic) {
    return {
      ok: false,
      output: "",
      variations: [],
      demo: false,
      provider: null,
      model: null,
      status: "failed",
      error: "Add a topic to generate content.",
    };
  }

  // Enforce the monthly AI generation quota (live workspaces only).
  const quota = await checkAiQuota();
  if (!quota.allowed) {
    return {
      ok: false,
      output: "",
      variations: [],
      demo: false,
      provider: null,
      model: null,
      status: "failed",
      error: `Monthly AI limit reached (${quota.used}/${quota.limit}). Upgrade your plan for more.`,
    };
  }

  const result = await generateAI({ ...input, topic });
  const { user } = buildPrompt({ ...input, topic });

  await createGeneration({
    tool: input.tool,
    prompt: user,
    output: result.output,
    input: { ...input, topic },
    outputJson: { variations: result.variations },
    provider: result.provider,
    model: result.model,
    status: result.status,
    promptVersion: PROMPT_VERSION,
    errorMessage: result.error ?? null,
  });

  revalidatePath("/content-studio");
  return result;
}

/** Save a generation as a content idea. */
export async function saveGenerationAsIdea(args: {
  tool: AIToolId;
  topic: string;
  output: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const title = args.topic.trim() || `${toolLabel(args.tool)} draft`;
    const idea = await dbCreateIdea({
      title,
      category: toolLabel(args.tool),
      content_type: contentTypeForTool(args.tool),
      notes: args.output,
    });
    revalidatePath("/ideas");
    return { ok: true, id: idea.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Convert a generation into a draft post, mapping output to the right field. */
export async function convertGenerationToPost(args: {
  tool: AIToolId;
  topic: string;
  platform?: string;
  output: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const title = args.topic.trim() || `${toolLabel(args.tool)} post`;
    const platform = (args.platform ?? "").toLowerCase();

    const fields: Record<string, string> = {};
    if (args.tool === "hashtag") fields.hashtags = args.output;
    else if (args.tool === "cta") fields.cta = args.output;
    else if (args.tool === "linkedin" || platform === "linkedin")
      fields.linkedin_caption = args.output;
    else if (args.tool === "instagram" || platform === "instagram")
      fields.instagram_caption = args.output;
    else fields.universal_caption = args.output;

    const post = await dbCreatePost({
      title,
      topic: args.topic.trim() || null,
      post_type: contentTypeForTool(args.tool),
      status: "draft",
      ...fields,
    });
    revalidatePath("/posts");
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
