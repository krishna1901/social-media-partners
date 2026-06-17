import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import type { PublishContext, PublishResult } from "@/lib/publishing/platforms";

/**
 * Meta covers both Instagram and Facebook (Graph API). The scheduler routes both
 * `instagram` and `facebook` jobs to this module.
 */
export const platform = "meta" as const;

/**
 * PLACEHOLDER. Does not contact the Meta Graph API or publish anything.
 *
 * // TODO(phase3d): implement official Meta publishing
 * (Instagram Graph API media container + publish, and Facebook Pages feed).
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost,
  _ctx: PublishContext
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "Meta (Instagram/Facebook) publishing is a Phase 3D TODO",
  };
}
