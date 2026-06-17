import "server-only";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";

/** Stable result shape returned by every platform `publish` placeholder. */
export interface PublishResult {
  ok: boolean;
  status: "posted" | "failed" | "not_implemented";
  message: string;
}

export const platform = "linkedin" as const;

/**
 * PLACEHOLDER. Does not contact LinkedIn or publish anything.
 *
 * // TODO(phase3): implement official LinkedIn API publishing
 * (OAuth2 + UGC/Posts API). Until then this is a no-op that reports it is
 * unimplemented so the scheduler can record the job without side effects.
 */
export async function publish(
  _job: PublishingJobRow,
  _formatted: FormattedPost
): Promise<PublishResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "LinkedIn publishing is a Phase 3 TODO",
  };
}
