import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";
import { isTikTokConfigured, publishVideoFromUrl } from "@/lib/integrations/tiktok";
import { getFreshScaffoldToken } from "@/lib/publishing/refresh";
import { linkedMediaUrl } from "@/lib/publishing/media";

export const platform = "tiktok" as const;

function composeTitle(formatted: FormattedPost): string {
  const tags = formatted.hashtags.length ? ` ${formatted.hashtags.join(" ")}` : "";
  return `${formatted.caption}${tags}`.trim();
}

/**
 * Publish to TikTok (Phase 6) via the Content Posting API (PULL_FROM_URL).
 * Returns `not_implemented` when TikTok isn't configured/connected (runner
 * simulates). TikTok is video-only, so a linked video asset with a public URL is
 * required; without one it's an honest failure. Live posting needs TikTok's
 * content-posting audit.
 */
export async function publish(
  job: PublishingJobRow,
  formatted: FormattedPost,
  ctx: PublishContext
): Promise<PublishResult> {
  if (!isTikTokConfigured()) {
    return { ok: false, status: "not_implemented", message: "TikTok app credentials not configured" };
  }

  const token = await getFreshScaffoldToken(ctx.client, job.workspace_id, "tiktok");
  if (!token) {
    return { ok: false, status: "not_implemented", message: "TikTok account not connected" };
  }

  const videoUrl = await linkedMediaUrl(ctx.client, job, "video");
  if (!videoUrl) {
    return {
      ok: false,
      status: "failed",
      message: "TikTok requires a linked video asset with a public URL",
    };
  }

  try {
    const result = await publishVideoFromUrl(token.accessToken, videoUrl, composeTitle(formatted));
    return {
      ok: true,
      status: "posted",
      message: "Published to TikTok",
      externalId: result.id || undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      message: err instanceof Error ? err.message : "TikTok publish failed",
    };
  }
}
