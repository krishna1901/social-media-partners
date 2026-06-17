import "server-only";
import { requireLiveContext } from "@/lib/db/context";
import type { Platform } from "@/lib/demo-data";
import type { ScheduledPostRow, PublishingJobRow } from "@/lib/db/types";
import { createJob, logJobEvent } from "@/lib/publishing/jobs";

/**
 * Phase 2 — scheduling orchestration.
 *
 * Coordinates `scheduled_posts` and `publishing_jobs`: scheduling a post creates
 * a scheduling-intent row, flips the post to 'scheduled', and fans out one
 * 'queued' job per enabled channel.
 *
 * IMPORTANT: nothing here publishes to a real platform. Jobs are created in the
 * 'queued' state and left there.
 *
 * // TODO(phase3): a cron/queue runner (e.g. Supabase Edge Function or a worker)
 * will poll `publishing_jobs` where status='queued' and run_at <= now(), call
 * the matching `@/lib/publishing/platforms/*` `publish()` implementation, and
 * advance status to 'processing' → 'posted'/'failed'. That runner does NOT exist
 * yet; these functions only set up the records it will consume.
 */

export type ScheduleMode = ScheduledPostRow["mode"];

export interface ScheduleOptions {
  mode: ScheduleMode;
  /** Required for 'custom'; ignored for 'now'/'next_queue'. */
  scheduledAt?: string | null;
}

export interface ScheduleResult {
  scheduledPost: ScheduledPostRow;
  jobs: PublishingJobRow[];
}

/** Resolves the effective run timestamp (ISO string) for a scheduling mode. */
function resolveRunAt(mode: ScheduleMode, scheduledAt?: string | null): string {
  const now = new Date();
  switch (mode) {
    case "now":
      return now.toISOString();
    case "next_queue":
      // TODO(phase3): compute the real "next available queue slot" from the
      // workspace posting schedule (settings.posting_prefs). Placeholder: +1 day.
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case "custom":
      return scheduledAt ?? now.toISOString();
    default:
      return now.toISOString();
  }
}

/** Enabled channel platforms for a post, scoped to the workspace. */
async function enabledPlatformsForPost(
  ctx: Awaited<ReturnType<typeof requireLiveContext>>,
  postId: string
): Promise<Platform[]> {
  const { data } = await ctx.supabase
    .from("post_channels")
    .select("platform")
    .eq("workspace_id", ctx.workspaceId)
    .eq("post_id", postId)
    .eq("enabled", true);

  return ((data as { platform: Platform }[] | null) ?? []).map((row) => row.platform);
}

/**
 * Schedules a post: creates a `scheduled_posts` row, marks the post 'scheduled',
 * and creates one queued `publishing_jobs` row per enabled channel. Jobs are NOT
 * run. Throws in demo mode.
 */
export async function schedulePost(
  postId: string,
  options: ScheduleOptions
): Promise<ScheduleResult> {
  const ctx = await requireLiveContext();
  const runAt = resolveRunAt(options.mode, options.scheduledAt);

  // 1. Scheduling-intent row.
  const { data: scheduled, error: scheduleError } = await ctx.supabase
    .from("scheduled_posts")
    .insert({
      workspace_id: ctx.workspaceId,
      post_id: postId,
      created_by: ctx.userId,
      mode: options.mode,
      scheduled_at: runAt,
      status: "queued",
    })
    .select("*")
    .single();

  if (scheduleError || !scheduled) {
    throw new Error(
      `Failed to create scheduled post: ${scheduleError?.message ?? "unknown error"}`
    );
  }
  const scheduledPost = scheduled as ScheduledPostRow;

  // 2. Flip the post into the 'scheduled' state + record its scheduled_at.
  await ctx.supabase
    .from("posts")
    .update({ status: "scheduled", scheduled_at: runAt })
    .eq("id", postId)
    .eq("workspace_id", ctx.workspaceId);

  // 3. Fan out one queued job per enabled channel. (No publishing happens.)
  const platforms = await enabledPlatformsForPost(ctx, postId);
  const jobs: PublishingJobRow[] = [];
  for (const platform of platforms) {
    const job = await createJob({
      platform,
      postId,
      scheduledPostId: scheduledPost.id,
      runAt,
      status: "queued",
    });
    jobs.push(job);
    await logJobEvent(job.id, "info", `Queued ${platform} job (mode=${options.mode})`, {
      mode: options.mode,
      runAt,
    });
  }

  return { scheduledPost, jobs };
}

/**
 * Reschedules an existing scheduled post (and its still-pending jobs) to a new
 * timestamp. Already-finished jobs are left untouched.
 */
export async function updateSchedule(
  scheduledPostId: string,
  scheduledAt: string
): Promise<ScheduledPostRow> {
  const ctx = await requireLiveContext();

  const { data, error } = await ctx.supabase
    .from("scheduled_posts")
    .update({ scheduled_at: scheduledAt, mode: "custom", status: "queued" })
    .eq("id", scheduledPostId)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update schedule: ${error?.message ?? "unknown error"}`);
  }
  const scheduledPost = data as ScheduledPostRow;

  // Move the pending jobs to the new run time, and keep the post in sync.
  await ctx.supabase
    .from("publishing_jobs")
    .update({ run_at: scheduledAt })
    .eq("scheduled_post_id", scheduledPostId)
    .eq("workspace_id", ctx.workspaceId)
    .in("status", ["queued", "processing"]);

  await ctx.supabase
    .from("posts")
    .update({ scheduled_at: scheduledAt })
    .eq("id", scheduledPost.post_id)
    .eq("workspace_id", ctx.workspaceId);

  return scheduledPost;
}

/**
 * Cancels a scheduled post: sets the schedule to 'cancelled' and cancels any of
 * its pending jobs.
 */
export async function cancelSchedule(scheduledPostId: string): Promise<ScheduledPostRow> {
  const ctx = await requireLiveContext();

  const { data, error } = await ctx.supabase
    .from("scheduled_posts")
    .update({ status: "cancelled" })
    .eq("id", scheduledPostId)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to cancel schedule: ${error?.message ?? "unknown error"}`);
  }

  // Cancel only the jobs that haven't reached a terminal state.
  await ctx.supabase
    .from("publishing_jobs")
    .update({ status: "cancelled" })
    .eq("scheduled_post_id", scheduledPostId)
    .eq("workspace_id", ctx.workspaceId)
    .in("status", ["queued", "processing"]);

  return data as ScheduledPostRow;
}

/**
 * Retries a job. PLACEHOLDER: resets it to 'queued', bumps `attempts`, clears the
 * error, and logs the retry. Does NOT re-run any publishing.
 *
 * // TODO(phase3): once the runner exists, retry should re-enqueue and let the
 * runner perform the actual platform call.
 */
export async function retryJob(jobId: string): Promise<PublishingJobRow> {
  const ctx = await requireLiveContext();

  // Read current attempts so we can increment (no DB-side expression here).
  const { data: current } = await ctx.supabase
    .from("publishing_jobs")
    .select("attempts")
    .eq("id", jobId)
    .eq("workspace_id", ctx.workspaceId)
    .single();

  const attempts = ((current as { attempts: number } | null)?.attempts ?? 0) + 1;

  const { data, error } = await ctx.supabase
    .from("publishing_jobs")
    .update({ status: "queued", attempts, error_message: null })
    .eq("id", jobId)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to retry job: ${error?.message ?? "unknown error"}`);
  }

  await logJobEvent(jobId, "info", "Job re-queued for retry (no publishing performed)", {
    attempts,
  });

  return data as PublishingJobRow;
}
