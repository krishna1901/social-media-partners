import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";

export const platform = "x" as const;

/**
 * PLACEHOLDER. Does not contact X or publish anything.
 *
 * // TODO(phase3g): implement official X API publishing
 * (v2 POST /2/tweets + media upload).
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost,
  _ctx: PublishContext
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "X publishing is a Phase 3G TODO",
  };
}
