import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";
import { isXConfigured, createTweet } from "@/lib/integrations/x";
import { getFreshScaffoldToken } from "@/lib/publishing/refresh";

export const platform = "x" as const;

const TWEET_LIMIT = 280;

/** Compose caption + hashtags into tweet text, clamped to the character limit. */
function composeText(formatted: FormattedPost): string {
  const tags = formatted.hashtags.length ? `\n\n${formatted.hashtags.join(" ")}` : "";
  const full = `${formatted.caption}${tags}`.trim();
  return full.length > TWEET_LIMIT ? `${full.slice(0, TWEET_LIMIT - 1).trimEnd()}…` : full;
}

/**
 * Publish a text post to X (Phase 6). Returns `not_implemented` when X isn't
 * configured or the workspace has no token (the runner then simulates by
 * default). When connected, it makes a real POST /2/tweets call, refreshing the
 * short-lived access token first if needed.
 */
export async function publish(
  job: PublishingJobRow,
  formatted: FormattedPost,
  ctx: PublishContext
): Promise<PublishResult> {
  if (!isXConfigured()) {
    return { ok: false, status: "not_implemented", message: "X app credentials not configured" };
  }

  const token = await getFreshScaffoldToken(ctx.client, job.workspace_id, "x");
  if (!token) {
    return { ok: false, status: "not_implemented", message: "X account not connected" };
  }

  const text = composeText(formatted);
  if (!text) {
    return { ok: false, status: "failed", message: "Empty caption — nothing to publish" };
  }

  try {
    const result = await createTweet(token.accessToken, text);
    return {
      ok: true,
      status: "posted",
      message: "Published to X",
      externalId: result.id || undefined,
      externalUrl: result.url || undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      message: err instanceof Error ? err.message : "X publish failed",
    };
  }
}
