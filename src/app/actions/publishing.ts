"use server";

import { revalidatePath } from "next/cache";
import { runWorkspaceDueJobs, type RunnerSummary } from "@/lib/publishing/runner";
import { retryJob, cancelSchedule } from "@/lib/publishing/scheduler";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function revalidatePublishing(): void {
  revalidatePath("/calendar");
  revalidatePath("/posts");
}

/** Manually drain the active workspace's due publishing jobs ("process now"). */
export async function runDueJobsAction(): Promise<ActionResult<{ summary: RunnerSummary }>> {
  try {
    const summary = await runWorkspaceDueJobs();
    revalidatePublishing();
    return { ok: true, summary };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Re-queue a failed/cancelled job for another run. */
export async function retryJobAction(jobId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const job = await retryJob(jobId);
    revalidatePublishing();
    return { ok: true, id: job.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Cancel a scheduled post and its pending jobs. */
export async function cancelScheduleAction(
  scheduledPostId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const scheduled = await cancelSchedule(scheduledPostId);
    revalidatePublishing();
    return { ok: true, id: scheduled.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
