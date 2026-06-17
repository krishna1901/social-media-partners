import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";
import { isYouTubeConfigured, uploadVideoFromUrl } from "@/lib/integrations/youtube";
import { getFreshScaffoldToken } from "@/lib/publishing/refresh";
import { linkedMediaUrl } from "@/lib/publishing/media";

export const platform = "youtube" as const;

/** First non-empty caption line → video title. */
function deriveTitle(formatted: FormattedPost): string {
  const firstLine =
    (formatted.caption || "")
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean) ?? "New video";
  return firstLine.slice(0, 100);
}

/** Full caption + hashtags → video description. */
function deriveDescription(formatted: FormattedPost): string {
  const tags = formatted.hashtags.length ? `\n\n${formatted.hashtags.join(" ")}` : "";
  return `${formatted.caption}${tags}`.trim();
}

/**
 * Publish to YouTube (Phase 6) via the Data API v3 resumable upload. Returns
 * `not_implemented` when YouTube isn't configured/connected (runner simulates).
 * YouTube needs a video file, so a linked video asset with a public URL is
 * required; without one it's an honest failure.
 */
export async function publish(
  job: PublishingJobRow,
  formatted: FormattedPost,
  ctx: PublishContext
): Promise<PublishResult> {
  if (!isYouTubeConfigured()) {
    return { ok: false, status: "not_implemented", message: "YouTube app credentials not configured" };
  }

  const token = await getFreshScaffoldToken(ctx.client, job.workspace_id, "youtube");
  if (!token) {
    return { ok: false, status: "not_implemented", message: "YouTube account not connected" };
  }

  const videoUrl = await linkedMediaUrl(ctx.client, job, "video");
  if (!videoUrl) {
    return {
      ok: false,
      status: "failed",
      message: "YouTube requires a linked video asset with a public URL",
    };
  }

  try {
    const result = await uploadVideoFromUrl(
      token.accessToken,
      videoUrl,
      deriveTitle(formatted),
      deriveDescription(formatted)
    );
    return {
      ok: true,
      status: "posted",
      message: "Published to YouTube",
      externalId: result.id || undefined,
      externalUrl: result.url || undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      message: err instanceof Error ? err.message : "YouTube publish failed",
    };
  }
}
