import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";

/** Stable result shape returned by every platform `publish` placeholder. */
export interface PublishResult {
  ok: boolean;
  status: "posted" | "failed" | "not_implemented";
  message: string;
}

/**
 * Meta covers both Instagram and Facebook (Graph API). The `platform` id here is
 * "meta"; the scheduler routes both `instagram` and `facebook` jobs to this
 * module.
 */
export const platform = "meta" as const;

/**
 * PLACEHOLDER. Does not contact the Meta Graph API or publish anything.
 *
 * // TODO(phase3): implement official Meta publishing
 * (Instagram Graph API media container + publish, and Facebook Pages feed).
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "Meta (Instagram/Facebook) publishing is a Phase 3 TODO",
  };
}
