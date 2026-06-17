"use server";

/**
 * Phase 2 — mock AI generation.
 *
 * Returns placeholder copy so the Content Studio UI is exercisable end-to-end
 * without a real model. No DB persistence happens here: there is no
 * `ai_generations` data-access module to call yet.
 *
 * // TODO(phase3): wire OpenAI/Claude + persist to ai_generations
 *   - call the real provider (selected via settings.ai_provider)
 *   - insert a row into an `ai_generations` table (tool_id, prompt, output,
 *     model, token usage) scoped to the active workspace via requireLiveContext()
 */
export async function generateContent(toolId: string, prompt: string) {
  // Simulate model latency so loading states behave realistically.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    content: `Here is the generated ${toolId} for: "${prompt}"\n\n1. This is a great point to make.\n2. Keep it engaging and concise.\n3. Add a call to action at the end!\n\n#content #ai`,
  };
}
