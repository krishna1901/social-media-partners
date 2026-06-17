import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";

export const platform = "youtube" as const;

/**
 * PLACEHOLDER. Does not contact YouTube or publish anything.
 *
 * // TODO(phase3g): implement official YouTube API publishing
 * (Data API v3 resumable video upload + metadata).
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost,
  _ctx: PublishContext
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "YouTube publishing is a Phase 3G TODO",
  };
}
