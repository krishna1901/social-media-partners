import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";
import { isMetaConfigured, publishToFacebookPage, publishToInstagram } from "@/lib/integrations/meta";
import { getDecryptedToken } from "@/lib/db/social-tokens";

/**
 * Meta covers Instagram + Facebook (Graph API). The runner routes `instagram`
 * and `facebook` jobs here (Phase 3D).
 */
export const platform = "meta" as const;

function composeText(formatted: FormattedPost): string {
  const tags = formatted.hashtags.length ? `\n\n${formatted.hashtags.join(" ")}` : "";
  return `${formatted.caption}${tags}`.trim();
}

/** First public image URL linked to the post (Instagram needs a hosted image). */
async function linkedImageUrl(ctx: PublishContext, job: PublishingJobRow): Promise<string | null> {
  if (!job.post_id) return null;
  const { data } = await ctx.client
    .from("media_assets")
    .select("url, kind")
    .eq("workspace_id", job.workspace_id)
    .eq("linked_post_id", job.post_id)
    .eq("kind", "image")
    .not("url", "is", null)
    .limit(1)
    .maybeSingle();
  return (data as { url: string | null } | null)?.url ?? null;
}

/**
 * Publish to Facebook (Page feed) or Instagram (container + publish).
 *
 * Returns `not_implemented` when Meta isn't configured or the platform isn't
 * connected — the runner then simulates. Real calls use the stored Page token.
 */
export async function publish(
  job: PublishingJobRow,
  formatted: FormattedPost,
  ctx: PublishContext
): Promise<PublishResult> {
  if (!isMetaConfigured()) {
    return { ok: false, status: "not_implemented", message: "Meta app credentials not configured" };
  }

  const token = await getDecryptedToken(ctx.client, job.workspace_id, job.platform);
  if (!token || !token.externalId) {
    return { ok: false, status: "not_implemented", message: `${job.platform} account not connected` };
  }

  const text = composeText(formatted);

  try {
    if (job.platform === "facebook") {
      if (!text) return { ok: false, status: "failed", message: "Empty caption — nothing to publish" };
      const result = await publishToFacebookPage(token.externalId, token.accessToken, text);
      return {
        ok: true,
        status: "posted",
        message: "Published to Facebook",
        externalId: result.id,
        externalUrl: result.url ?? undefined,
      };
    }

    // Instagram requires a hosted image.
    const imageUrl = await linkedImageUrl(ctx, job);
    if (!imageUrl) {
      return {
        ok: false,
        status: "failed",
        message: "Instagram requires a linked image asset with a public URL",
      };
    }
    const result = await publishToInstagram(token.externalId, token.accessToken, imageUrl, text);
    return {
      ok: true,
      status: "posted",
      message: "Published to Instagram",
      externalId: result.id,
      externalUrl: result.url ?? undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      message: err instanceof Error ? err.message : "Meta publish failed",
    };
  }
}
