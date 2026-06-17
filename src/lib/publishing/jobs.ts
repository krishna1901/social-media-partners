import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { Platform } from "@/lib/demo-data";
import type { PublishingJobRow } from "@/lib/db/types";

/**
 * Phase 2 — publishing jobs data layer.
 *
 * Server-only CRUD over `publishing_jobs` and `publishing_logs`, scoped to the
 * active workspace. Reads fall back to empty arrays in demo/preview mode so the
 * UI never breaks; mutations require a live, authenticated context.
 *
 * Nothing here publishes to a real platform — jobs are records the Phase 3
 * runner will consume.
 */

export type JobStatus = PublishingJobRow["status"];
export type LogLevel = "info" | "warning" | "error";

export interface PublishingLogRow {
  id: string;
  workspace_id: string;
  job_id: string | null;
  level: LogLevel;
  message: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

/** Fields accepted when creating a publishing job. */
export interface CreateJobInput {
  platform: Platform;
  postId?: string | null;
  scheduledPostId?: string | null;
  runAt?: string | null;
  status?: JobStatus;
}

/** Optional filter for `listJobs`. */
export interface JobFilter {
  status?: JobStatus;
  platform?: Platform;
  scheduledPostId?: string;
  postId?: string;
}

/* ----------------------------------- reads ----------------------------------- */

/** All publishing jobs for the workspace, newest first. Demo → []. */
export async function listJobs(filter?: JobFilter): Promise<PublishingJobRow[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return [];

  let query = ctx.supabase
    .from("publishing_jobs")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.platform) query = query.eq("platform", filter.platform);
  if (filter?.scheduledPostId) query = query.eq("scheduled_post_id", filter.scheduledPostId);
  if (filter?.postId) query = query.eq("post_id", filter.postId);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as PublishingJobRow[];
}

/** Jobs belonging to a single post, newest first. Demo → []. */
export async function getJobsForPost(postId: string): Promise<PublishingJobRow[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return [];

  const { data, error } = await ctx.supabase
    .from("publishing_jobs")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PublishingJobRow[];
}

/* --------------------------------- mutations --------------------------------- */

/** Creates a publishing job (defaults to 'queued'). Throws in demo mode. */
export async function createJob(input: CreateJobInput): Promise<PublishingJobRow> {
  const ctx = await requireLiveContext();

  const { data, error } = await ctx.supabase
    .from("publishing_jobs")
    .insert({
      workspace_id: ctx.workspaceId,
      platform: input.platform,
      post_id: input.postId ?? null,
      scheduled_post_id: input.scheduledPostId ?? null,
      run_at: input.runAt ?? null,
      status: input.status ?? "queued",
      attempts: 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create publishing job: ${error?.message ?? "unknown error"}`);
  }
  return data as PublishingJobRow;
}

/** Updates a job's status (optionally recording an error message). */
export async function updateJobStatus(
  id: string,
  status: JobStatus,
  error?: string | null
): Promise<PublishingJobRow> {
  const ctx = await requireLiveContext();

  const { data, error: dbError } = await ctx.supabase
    .from("publishing_jobs")
    .update({ status, error_message: error ?? null })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();

  if (dbError || !data) {
    throw new Error(`Failed to update job status: ${dbError?.message ?? "unknown error"}`);
  }
  return data as PublishingJobRow;
}

/** Appends an audit/error entry to `publishing_logs`. */
export async function logJobEvent(
  jobId: string,
  level: LogLevel,
  message: string,
  payload?: Record<string, unknown>
): Promise<PublishingLogRow> {
  const ctx = await requireLiveContext();

  const { data, error } = await ctx.supabase
    .from("publishing_logs")
    .insert({
      workspace_id: ctx.workspaceId,
      job_id: jobId,
      level,
      message,
      payload: payload ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to write publishing log: ${error?.message ?? "unknown error"}`);
  }
  return data as PublishingLogRow;
}
