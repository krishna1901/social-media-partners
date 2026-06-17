import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";

export const platform = "tiktok" as const;

/**
 * PLACEHOLDER. Does not contact TikTok or publish anything.
 *
 * // TODO(phase3g): implement official TikTok API publishing
 * (Content Posting API — direct post / upload).
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost,
  _ctx: PublishContext
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "TikTok publishing is a Phase 3G TODO",
  };
}
