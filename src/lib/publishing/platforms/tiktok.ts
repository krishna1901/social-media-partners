import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";

/** Stable result shape returned by every platform `publish` placeholder. */
export interface PublishResult {
  ok: boolean;
  status: "posted" | "failed" | "not_implemented";
  message: string;
}

export const platform = "tiktok" as const;

/**
 * PLACEHOLDER. Does not contact TikTok or publish anything.
 *
 * // TODO(phase3): implement official TikTok API publishing
 * (Content Posting API — direct post / upload).
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "TikTok publishing is a Phase 3 TODO",
  };
}
