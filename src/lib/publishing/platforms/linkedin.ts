import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";
import { isLinkedInConfigured, createTextPost } from "@/lib/integrations/linkedin";
import { getDecryptedToken } from "@/lib/db/social-tokens";

export const platform = "linkedin" as const;

/** Compose the caption + hashtags into the post body. */
function composeText(formatted: FormattedPost): string {
  const tags = formatted.hashtags.length ? `\n\n${formatted.hashtags.join(" ")}` : "";
  return `${formatted.caption}${tags}`.trim();
}

/**
 * Publish a post to LinkedIn as the connected member (Phase 3C).
 *
 * Returns `not_implemented` when LinkedIn isn't configured or the workspace has
 * no stored token — the runner then records a simulated success so demo/preview
 * stays observable. When fully connected, it makes a real Posts API call.
 */
export async function publish(
  job: PublishingJobRow,
  formatted: FormattedPost,
  ctx: PublishContext
): Promise<PublishResult> {
  if (!isLinkedInConfigured()) {
    return { ok: false, status: "not_implemented", message: "LinkedIn app credentials not configured" };
  }

  const token = await getDecryptedToken(ctx.client, job.workspace_id, "linkedin");
  if (!token || !token.externalId) {
    return { ok: false, status: "not_implemented", message: "LinkedIn account not connected" };
  }

  const text = composeText(formatted);
  if (!text) {
    return { ok: false, status: "failed", message: "Empty caption — nothing to publish" };
  }

  try {
    const result = await createTextPost(token.accessToken, token.externalId, text);
    return {
      ok: true,
      status: "posted",
      message: "Published to LinkedIn",
      externalId: result.id || undefined,
      externalUrl: result.url || undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      message: err instanceof Error ? err.message : "LinkedIn publish failed",
    };
  }
}
