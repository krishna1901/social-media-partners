import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Platform } from "@/lib/demo-data";
import type { PublishingJobRow } from "@/lib/db/types";
import type { FormattedPost } from "@/lib/publishing/formatter";
import { publish as publishLinkedIn } from "./linkedin";
import { publish as publishMeta } from "./meta";
import { publish as publishYouTube } from "./youtube";
import { publish as publishTikTok } from "./tiktok";
import { publish as publishX } from "./x";

/**
 * Unified publish result. Platform modules return the `ok|status|message`
 * subset; real publishers (Phase 3C+) may additionally include the external id
 * and permalink.
 */
export interface PublishResult {
  ok: boolean;
  status: "posted" | "failed" | "not_implemented";
  message: string;
  externalId?: string;
  externalUrl?: string;
}

/**
 * Context handed to publishers so they can load workspace-scoped credentials
 * (e.g. decrypted OAuth tokens) using the runner's Supabase client — either the
 * service-role client (cron) or the user-session client (manual run).
 */
export interface PublishContext {
  client: SupabaseClient;
}

/**
 * Dispatch a job to the matching platform publisher. Instagram + Facebook both
 * route to the Meta module (Graph API). Platforms without a real publisher yet
 * report `not_implemented`, which the runner records as a simulated success by
 * default.
 */
export async function publishToPlatform(
  platform: Platform,
  job: PublishingJobRow,
  formatted: FormattedPost,
  ctx: PublishContext
): Promise<PublishResult> {
  switch (platform) {
    case "linkedin":
      return publishLinkedIn(job, formatted, ctx);
    case "instagram":
    case "facebook":
      return publishMeta(job, formatted, ctx);
    case "youtube":
      return publishYouTube(job, formatted, ctx);
    case "tiktok":
      return publishTikTok(job, formatted, ctx);
    case "x":
      return publishX(job, formatted, ctx);
    default:
      return { ok: false, status: "failed", message: `Unsupported platform: ${platform}` };
  }
}
