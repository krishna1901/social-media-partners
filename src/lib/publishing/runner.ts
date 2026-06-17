import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Platform } from "@/lib/demo-data";
import type { PostRow, PublishingJobRow } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireLiveContext } from "@/lib/db/context";
import { formatForPlatform } from "@/lib/publishing/formatter";
import { publishToPlatform } from "@/lib/publishing/platforms";

/**
 * Phase 3B — publishing job runner.
 *
 * Drains due `publishing_jobs` (status='queued', run_at <= now), claims each
 * atomically, formats the post, dispatches to the matching platform publisher,
 * and advances status to 'posted'/'failed' with retry+backoff. Job events are
 * appended to `publishing_logs`, and the parent `scheduled_posts` + `posts` rows
 * are reconciled once all sibling jobs reach a terminal state.
 *
 * Two entry points:
 *   • `runAllDueJobs()`       — cron/background, service-role client (all workspaces).
 *   • `runWorkspaceDueJobs()` — manual trigger, user session client (own workspace).
 *
 * Simulation: platform publishers are placeholders until Phase 3C+. When
 * `PUBLISH_SIMULATE` !== "false" (the default), a `not_implemented` result is
 * recorded as a *simulated* success so the full schedule→publish→posted
 * lifecycle is observable. Set `PUBLISH_SIMULATE=false` to make jobs fail
 * honestly until a real publisher is wired in.
 */

const MAX_ATTEMPTS = 3;
/** Per-attempt retry backoff, in minutes (clamped to the last entry). */
const BACKOFF_MINUTES = [1, 5, 15];
const TERMINAL: PublishingJobRow["status"][] = ["posted", "failed", "cancelled"];

export type RunnerMode = "live" | "simulate" | "demo";

export interface JobOutcome {
  id: string;
  platform: string;
  status: PublishingJobRow["status"];
  message: string;
}

export interface RunnerSummary {
  ok: boolean;
  mode: RunnerMode;
  claimed: number;
  posted: number;
  failed: number;
  requeued: number;
  jobs: JobOutcome[];
  message?: string;
}

interface DrainOptions {
  limit: number;
  now: Date;
  workspaceId?: string;
}

function simulateEnabled(): boolean {
  return process.env.PUBLISH_SIMULATE !== "false";
}

async function writeLog(
  client: SupabaseClient,
  workspaceId: string,
  jobId: string,
  level: "info" | "warning" | "error",
  message: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await client.from("publishing_logs").insert({
    workspace_id: workspaceId,
    job_id: jobId,
    level,
    message,
    payload: payload ?? null,
  });
}

async function setJobStatus(
  client: SupabaseClient,
  job: PublishingJobRow,
  status: PublishingJobRow["status"],
  errorMessage: string | null,
  attempts?: number
): Promise<void> {
  const patch: Record<string, unknown> = { status, error_message: errorMessage };
  if (typeof attempts === "number") patch.attempts = attempts;
  await client.from("publishing_jobs").update(patch).eq("id", job.id);
}

/**
 * Once every sibling job (same scheduled_post, else same post) is terminal,
 * roll the parent `scheduled_posts` + `posts` status up: failed if any failed,
 * else posted if any posted, else cancelled.
 */
async function reconcileParents(client: SupabaseClient, job: PublishingJobRow): Promise<void> {
  if (!job.scheduled_post_id && !job.post_id) return;

  let q = client
    .from("publishing_jobs")
    .select("status")
    .eq("workspace_id", job.workspace_id);
  q = job.scheduled_post_id
    ? q.eq("scheduled_post_id", job.scheduled_post_id)
    : q.eq("post_id", job.post_id as string);

  const { data } = await q;
  const statuses = ((data as { status: PublishingJobRow["status"] }[] | null) ?? []).map(
    (r) => r.status
  );
  if (!statuses.length || !statuses.every((s) => TERMINAL.includes(s))) return;

  const finalStatus = statuses.includes("failed")
    ? "failed"
    : statuses.includes("posted")
      ? "posted"
      : "cancelled";

  if (job.scheduled_post_id) {
    await client
      .from("scheduled_posts")
      .update({ status: finalStatus })
      .eq("id", job.scheduled_post_id)
      .eq("workspace_id", job.workspace_id);
  }
  // Only flip the post to a content-valid terminal state.
  if (job.post_id && (finalStatus === "posted" || finalStatus === "failed")) {
    await client
      .from("posts")
      .update({ status: finalStatus })
      .eq("id", job.post_id)
      .eq("workspace_id", job.workspace_id);
  }
}

/** Process a single claimed (status='processing') job to a terminal/retry state. */
async function processJob(
  client: SupabaseClient,
  job: PublishingJobRow,
  simulate: boolean
): Promise<JobOutcome> {
  const { data: postData } = await client
    .from("posts")
    .select("*")
    .eq("id", job.post_id as string)
    .maybeSingle();

  if (!postData) {
    await setJobStatus(client, job, "failed", "Post not found", job.attempts + 1);
    await writeLog(client, job.workspace_id, job.id, "error", "Post not found; job failed");
    await reconcileParents(client, job);
    return { id: job.id, platform: job.platform, status: "failed", message: "Post not found" };
  }

  const post = postData as PostRow;
  const formatted = formatForPlatform(job.platform as Platform, post);

  let result;
  try {
    result = await publishToPlatform(job.platform as Platform, job, formatted, { client });
  } catch (err) {
    result = {
      ok: false,
      status: "failed" as const,
      message: err instanceof Error ? err.message : "Publisher threw an error",
    };
  }

  // Simulated success (placeholder publishers, simulate mode on).
  if (result.status === "not_implemented" && simulate) {
    await setJobStatus(client, job, "posted", null);
    await writeLog(
      client,
      job.workspace_id,
      job.id,
      "info",
      `Simulated publish to ${job.platform} (no live integration configured)`,
      { simulated: true }
    );
    await reconcileParents(client, job);
    return { id: job.id, platform: job.platform, status: "posted", message: "Simulated publish" };
  }

  // Real success.
  if (result.ok && result.status === "posted") {
    await setJobStatus(client, job, "posted", null);
    await writeLog(client, job.workspace_id, job.id, "info", `Published to ${job.platform}`, {
      message: result.message,
    });
    await reconcileParents(client, job);
    return { id: job.id, platform: job.platform, status: "posted", message: result.message };
  }

  // Not implemented + simulate off → honest, non-retryable failure.
  if (result.status === "not_implemented") {
    await setJobStatus(client, job, "failed", result.message, job.attempts + 1);
    await writeLog(client, job.workspace_id, job.id, "warning", result.message);
    await reconcileParents(client, job);
    return { id: job.id, platform: job.platform, status: "failed", message: result.message };
  }

  // Transient failure → retry with backoff, or give up after MAX_ATTEMPTS.
  const attempts = job.attempts + 1;
  if (attempts < MAX_ATTEMPTS) {
    const backoff = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
    const runAt = new Date(Date.now() + backoff * 60_000).toISOString();
    await client
      .from("publishing_jobs")
      .update({ status: "queued", attempts, error_message: result.message, run_at: runAt })
      .eq("id", job.id);
    await writeLog(
      client,
      job.workspace_id,
      job.id,
      "warning",
      `Publish failed (attempt ${attempts}/${MAX_ATTEMPTS}); retrying in ${backoff}m`,
      { error: result.message }
    );
    return {
      id: job.id,
      platform: job.platform,
      status: "queued",
      message: `Retry ${attempts}/${MAX_ATTEMPTS} scheduled`,
    };
  }

  await setJobStatus(client, job, "failed", result.message, attempts);
  await writeLog(
    client,
    job.workspace_id,
    job.id,
    "error",
    `Publish failed permanently after ${attempts} attempts`,
    { error: result.message }
  );
  await reconcileParents(client, job);
  return { id: job.id, platform: job.platform, status: "failed", message: result.message };
}

/** Roll a list of outcomes into a summary. */
function summarize(jobs: JobOutcome[], mode: RunnerMode): RunnerSummary {
  return {
    ok: true,
    mode,
    claimed: jobs.length,
    posted: jobs.filter((j) => j.status === "posted").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    requeued: jobs.filter((j) => j.status === "queued").length,
    jobs,
  };
}

/** Core loop: fetch due jobs, claim each atomically, process. */
async function drain(client: SupabaseClient, opts: DrainOptions): Promise<JobOutcome[]> {
  let q = client
    .from("publishing_jobs")
    .select("*")
    .eq("status", "queued")
    .or(`run_at.is.null,run_at.lte.${opts.now.toISOString()}`)
    .order("run_at", { ascending: true, nullsFirst: true })
    .limit(opts.limit);
  if (opts.workspaceId) q = q.eq("workspace_id", opts.workspaceId);

  const { data, error } = await q;
  if (error || !data) return [];

  const simulate = simulateEnabled();
  const outcomes: JobOutcome[] = [];

  for (const row of data as PublishingJobRow[]) {
    // Atomic claim: only succeeds if still 'queued' (guards against double runs).
    const { data: claimed } = await client
      .from("publishing_jobs")
      .update({ status: "processing" })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("*")
      .maybeSingle();
    if (!claimed) continue;

    outcomes.push(await processJob(client, claimed as PublishingJobRow, simulate));
  }
  return outcomes;
}

/**
 * Drain ALL workspaces' due jobs using the service-role client. Cron/background
 * entry point. No-op (mode "demo") when the service role isn't configured.
 */
export async function runAllDueJobs(opts?: {
  limit?: number;
  now?: Date;
}): Promise<RunnerSummary> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: true,
      mode: "demo",
      claimed: 0,
      posted: 0,
      failed: 0,
      requeued: 0,
      jobs: [],
      message: "Service role not configured — runner is a no-op in demo/preview mode.",
    };
  }
  const outcomes = await drain(admin, {
    limit: opts?.limit ?? 25,
    now: opts?.now ?? new Date(),
  });
  return summarize(outcomes, simulateEnabled() ? "simulate" : "live");
}

/**
 * Drain the active workspace's due jobs using the caller's session (RLS-scoped).
 * Manual "process now" entry point. Throws in demo mode (requires auth).
 */
export async function runWorkspaceDueJobs(opts?: {
  limit?: number;
  now?: Date;
}): Promise<RunnerSummary> {
  const ctx = await requireLiveContext();
  const outcomes = await drain(ctx.supabase, {
    limit: opts?.limit ?? 25,
    now: opts?.now ?? new Date(),
    workspaceId: ctx.workspaceId,
  });
  return summarize(outcomes, simulateEnabled() ? "simulate" : "live");
}
