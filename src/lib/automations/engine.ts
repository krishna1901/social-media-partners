import "server-only";
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDbContext, isLive } from "@/lib/db/context";
import { dispatchWebhook } from "@/lib/platform/webhook";
import {
  nextQueueSlot,
  defaultPostingPrefs,
  type PostingPrefs,
} from "@/lib/publishing/slots";
import type {
  AutomationRow,
  AutomationLogRow,
  AutomationTriggerType,
} from "@/lib/db/types";

/**
 * Phase 6 — general automation engine.
 *
 * Evaluates a workspace's ACTIVE general rules (`dm_automations` where
 * `trigger_type IS NOT NULL`) and performs SAFE internal actions only. It never
 * sends external replies and never auto-publishes to a social platform without
 * approval: actions that could lead to a publish (`queue-scheduled-post`) only
 * create `scheduled_posts`/`publishing_jobs` when the rule does NOT require
 * approval — otherwise they record a `pending` action for human review. Drafts,
 * ideas, suggested replies, logs and notifications are inherently safe and run
 * regardless of the approval flag.
 *
 * Mirrors the publishing/inbox runner pattern: a per-workspace core plus a
 * service-role (cron) and a session (manual) wrapper. Demo/preview is a no-op.
 * Each rule run appends exactly one summary row to `automation_logs`.
 */

type LogStatus = AutomationLogRow["status"];
type RunSource = "cron" | "manual" | "dry-run";

interface RunOpts {
  /** Limit the run to a single rule (used by dry-run / test). */
  ruleId?: string;
  /** Evaluate matches but make no writes (test mode). */
  dryRun?: boolean;
  source: RunSource;
}

interface RuleResult {
  status: LogStatus;
  actionTaken: string | null;
  error?: string | null;
  /** Items matched/affected (for the preview + summary). */
  matched: number;
  /** Executed actions to add to the rule's `runs` counter. */
  runsDelta: number;
  /** Whether to advance `last_run_at` (the time watermark) after a real run. */
  advanceWatermark: boolean;
}

export interface RuleOutcome {
  ruleId: string;
  ruleName: string;
  triggerType: AutomationTriggerType | null;
  status: LogStatus;
  actionTaken: string | null;
  matched: number;
}

export interface EngineRunSummary {
  ok: boolean;
  mode: "live" | "demo";
  rulesEvaluated: number;
  actionsTaken: number;
  pending: number;
  failed: number;
  outcomes: RuleOutcome[];
  message?: string;
}

const SCAN_LIMIT = 50;
const BATCH_LIMIT = 10;
const DAY_MS = 86_400_000;

/* --------------------------------- helpers --------------------------------- */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Watermark for time-based triggers: last_run_at, else the last 24h. */
function watermarkFor(rule: AutomationRow, now: Date): string {
  return rule.last_run_at ?? new Date(now.getTime() - DAY_MS).toISOString();
}

function intervalMs(frequency: string | undefined): number {
  switch (frequency) {
    case "hourly":
      return 60 * 60 * 1000;
    case "daily":
      return DAY_MS;
    case "weekly":
    default:
      return 7 * DAY_MS;
  }
}

const POST_TYPES = new Set(["carousel", "image", "video", "text", "reel", "story"]);
function safePostType(value: unknown, fallback = "text"): string {
  const v = str(value);
  return v && POST_TYPES.has(v) ? v : fallback;
}

/**
 * Queue a post into the next open slot using the provided client. This is the
 * ONLY place the engine creates publishing jobs, and it is reached only when a
 * rule does NOT require approval.
 */
async function queuePostViaClient(
  client: SupabaseClient,
  workspaceId: string,
  postId: string,
  now: Date
): Promise<void> {
  const { data: settings } = await client
    .from("settings")
    .select("posting_prefs, timezone")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const prefs: PostingPrefs = {
    ...defaultPostingPrefs,
    ...((settings?.posting_prefs as Partial<PostingPrefs> | null) ?? {}),
  };
  const timezone = (settings?.timezone as string | null) ?? "UTC";
  const runAt = nextQueueSlot(prefs, timezone, now);

  const { data: scheduled } = await client
    .from("scheduled_posts")
    .insert({
      workspace_id: workspaceId,
      post_id: postId,
      mode: "next_queue",
      scheduled_at: runAt,
      status: "queued",
    })
    .select("id")
    .single();

  await client
    .from("posts")
    .update({ status: "scheduled", scheduled_at: runAt })
    .eq("id", postId)
    .eq("workspace_id", workspaceId);

  const { data: channels } = await client
    .from("post_channels")
    .select("platform")
    .eq("workspace_id", workspaceId)
    .eq("post_id", postId)
    .eq("enabled", true);

  for (const row of (channels as { platform: string }[] | null) ?? []) {
    await client.from("publishing_jobs").insert({
      workspace_id: workspaceId,
      platform: row.platform,
      post_id: postId,
      scheduled_post_id: (scheduled as { id: string } | null)?.id ?? null,
      run_at: runAt,
      status: "queued",
      attempts: 0,
    });
  }
}

/* ------------------------------ trigger handlers ------------------------------ */

interface HandlerCtx {
  client: SupabaseClient;
  workspaceId: string;
  now: Date;
  nowIso: string;
  dryRun: boolean;
}

const SKIPPED: Omit<RuleResult, "actionTaken"> = {
  status: "skipped",
  matched: 0,
  runsDelta: 0,
  advanceWatermark: true,
};

/** inbox-keyword → draft a suggested reply (never sends). */
async function handleInboxKeyword(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const cond = asRecord(rule.conditions);
  const cfg = asRecord(rule.action_config);
  const keyword = str(cond.keyword)?.toLowerCase();
  if (!keyword) {
    return { ...SKIPPED, actionTaken: "No keyword configured — nothing to match.", advanceWatermark: false };
  }

  const { data } = await ctx.client
    .from("comments_inbox")
    .select("id, content")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "new")
    .is("reply_draft", null)
    .order("received_at", { ascending: true, nullsFirst: true })
    .limit(SCAN_LIMIT);

  const matches = ((data as { id: string; content: string | null }[] | null) ?? []).filter((i) =>
    (i.content ?? "").toLowerCase().includes(keyword)
  );

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Would draft replies for ${matches.length} inbox item(s) matching “${keyword}”.`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }
  if (matches.length === 0) {
    return { ...SKIPPED, actionTaken: `No new inbox items matched “${keyword}”.` };
  }

  const reply =
    str(cfg.replyTemplate) ??
    "Thanks for reaching out! Sending the details your way shortly.";
  for (const item of matches) {
    await ctx.client
      .from("comments_inbox")
      .update({ suggested_reply: reply, reply_draft: reply, updated_at: ctx.nowIso })
      .eq("id", item.id)
      .eq("workspace_id", ctx.workspaceId);
  }
  return {
    status: "success",
    actionTaken: `Drafted a suggested reply for ${matches.length} inbox item(s) — awaiting your send.`,
    matched: matches.length,
    runsDelta: matches.length,
    advanceWatermark: true,
  };
}

/** content-pool-queue → queue ready posts (approval-gated). */
async function handleContentPoolQueue(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const cond = asRecord(rule.conditions);
  const limit = clampInt(cond.limit, 1, 1, BATCH_LIMIT);
  const postType = str(cond.postType);

  let q = ctx.client
    .from("posts")
    .select("id, title")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "ready")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (postType) q = q.eq("post_type", postType);

  const matches = ((await q).data as { id: string; title: string }[] | null) ?? [];

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Would ${rule.requires_approval ? "propose queuing" : "queue"} ${matches.length} ready post(s) into the next slot.`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }
  if (matches.length === 0) {
    return { ...SKIPPED, actionTaken: "No ready posts in the content pool." };
  }
  if (rule.requires_approval) {
    return {
      status: "pending",
      actionTaken: `${matches.length} ready post(s) awaiting approval to queue (no publish performed).`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: true,
    };
  }
  for (const post of matches) {
    await queuePostViaClient(ctx.client, ctx.workspaceId, post.id, ctx.now);
  }
  return {
    status: "success",
    actionTaken: `Queued ${matches.length} post(s) into the next open slot.`,
    matched: matches.length,
    runsDelta: matches.length,
    advanceWatermark: true,
  };
}

/** recurring-post → create a draft from a template on a cadence, then queue. */
async function handleRecurringPost(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const cond = asRecord(rule.conditions);
  const cfg = asRecord(rule.action_config);
  const frequency = str(cond.frequency) ?? "weekly";
  const due = !rule.last_run_at || ctx.now.getTime() - new Date(rule.last_run_at).getTime() >= intervalMs(frequency);

  if (!due) {
    return {
      status: "skipped",
      actionTaken: `Not due yet (${frequency}).`,
      matched: 0,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }

  const title = str(cfg.title) ?? rule.name;
  const caption = str(cfg.caption) ?? null;
  const postType = safePostType(cfg.postType);

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Due now — would create a draft “${title}” and ${rule.requires_approval ? "await approval to queue" : "queue it"}.`,
      matched: 1,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }

  const { data: post, error } = await ctx.client
    .from("posts")
    .insert({
      workspace_id: ctx.workspaceId,
      title,
      universal_caption: caption,
      post_type: postType,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !post) throw error ?? new Error("Failed to create recurring draft.");

  if (rule.requires_approval) {
    return {
      status: "pending",
      actionTaken: `Created draft “${title}” — awaiting approval to queue (no publish performed).`,
      matched: 1,
      runsDelta: 1,
      advanceWatermark: true,
    };
  }
  await queuePostViaClient(ctx.client, ctx.workspaceId, (post as { id: string }).id, ctx.now);
  return {
    status: "success",
    actionTaken: `Created and queued draft “${title}”.`,
    matched: 1,
    runsDelta: 1,
    advanceWatermark: true,
  };
}

/** media-to-draft → create a draft post for each new media asset (safe). */
async function handleMediaToDraft(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const cond = asRecord(rule.conditions);
  const kind = str(cond.kind);
  const watermark = watermarkFor(rule, ctx.now);

  let q = ctx.client
    .from("media_assets")
    .select("id, name, kind")
    .eq("workspace_id", ctx.workspaceId)
    .eq("archived", false)
    .is("linked_post_id", null)
    .gt("created_at", watermark)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);
  if (kind) q = q.eq("kind", kind);

  const matches = ((await q).data as { id: string; name: string; kind: string }[] | null) ?? [];

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Would create ${matches.length} draft post(s) from newly uploaded media.`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }
  if (matches.length === 0) {
    return { ...SKIPPED, actionTaken: "No new media to turn into drafts." };
  }
  for (const media of matches) {
    const postType = media.kind === "video" ? "video" : "image";
    const { data: post } = await ctx.client
      .from("posts")
      .insert({
        workspace_id: ctx.workspaceId,
        title: `Draft from ${media.name}`,
        post_type: postType,
        status: "draft",
      })
      .select("id")
      .single();
    if (post) {
      await ctx.client
        .from("media_assets")
        .update({ linked_post_id: (post as { id: string }).id })
        .eq("id", media.id)
        .eq("workspace_id", ctx.workspaceId);
    }
  }
  return {
    status: "success",
    actionTaken: `Created ${matches.length} draft post(s) from new media.`,
    matched: matches.length,
    runsDelta: matches.length,
    advanceWatermark: true,
  };
}

/** failed-publish-alert → log + notify on newly failed publish jobs (safe). */
async function handleFailedPublishAlert(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const watermark = watermarkFor(rule, ctx.now);
  const { data } = await ctx.client
    .from("publishing_jobs")
    .select("id, platform, error_message")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "failed")
    .gt("updated_at", watermark)
    .order("updated_at", { ascending: true })
    .limit(SCAN_LIMIT);

  const matches = (data as { id: string; platform: string; error_message: string | null }[] | null) ?? [];

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Would alert on ${matches.length} failed publish job(s).`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }
  if (matches.length === 0) {
    return { ...SKIPPED, actionTaken: "No new failed publish jobs." };
  }
  // Best-effort outbound notification (admin-configured webhook). Never throws.
  await dispatchWebhook("automation.publish_failed", {
    workspaceId: ctx.workspaceId,
    ruleId: rule.id,
    jobs: matches.map((j) => ({ id: j.id, platform: j.platform, error: j.error_message })),
  });
  return {
    status: "success",
    actionTaken: `Logged & notified on ${matches.length} failed publish job(s).`,
    matched: matches.length,
    runsDelta: matches.length,
    advanceWatermark: true,
  };
}

/** idea-ready-to-draft → convert ready ideas into draft posts (safe). */
async function handleIdeaReadyToDraft(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const { data } = await ctx.client
    .from("content_ideas")
    .select("id, title, category, content_type, notes")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "ready")
    .is("converted_post_id", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  const matches =
    (data as { id: string; title: string; category: string | null; content_type: string; notes: string | null }[] | null) ?? [];

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Would convert ${matches.length} ready idea(s) into draft posts.`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }
  if (matches.length === 0) {
    return { ...SKIPPED, actionTaken: "No ready ideas to convert." };
  }
  for (const idea of matches) {
    const { data: post } = await ctx.client
      .from("posts")
      .insert({
        workspace_id: ctx.workspaceId,
        title: idea.title,
        topic: idea.category,
        post_type: safePostType(idea.content_type),
        status: "draft",
        notes: idea.notes,
      })
      .select("id")
      .single();
    if (post) {
      await ctx.client
        .from("content_ideas")
        .update({ converted_post_id: (post as { id: string }).id, status: "draft" })
        .eq("id", idea.id)
        .eq("workspace_id", ctx.workspaceId);
    }
  }
  return {
    status: "success",
    actionTaken: `Converted ${matches.length} ready idea(s) into draft posts.`,
    matched: matches.length,
    runsDelta: matches.length,
    advanceWatermark: true,
  };
}

/** competitor-post-to-idea → capture saved competitor posts as content ideas. */
async function handleCompetitorToIdea(rule: AutomationRow, ctx: HandlerCtx): Promise<RuleResult> {
  const watermark = watermarkFor(rule, ctx.now);
  const { data } = await ctx.client
    .from("competitor_posts")
    .select("id, title, format, hook, note")
    .eq("workspace_id", ctx.workspaceId)
    .gt("created_at", watermark)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  const matches =
    (data as { id: string; title: string | null; format: string | null; hook: string | null; note: string | null }[] | null) ?? [];

  if (ctx.dryRun) {
    return {
      status: "dry_run",
      actionTaken: `Would capture ${matches.length} saved competitor post(s) as ideas.`,
      matched: matches.length,
      runsDelta: 0,
      advanceWatermark: false,
    };
  }
  if (matches.length === 0) {
    return { ...SKIPPED, actionTaken: "No new saved competitor posts." };
  }
  for (const cp of matches) {
    await ctx.client.from("content_ideas").insert({
      workspace_id: ctx.workspaceId,
      title: cp.title ?? "Competitor post idea",
      category: "Competitor",
      priority: "medium",
      content_type: safePostType(cp.format),
      status: "idea",
      notes: cp.hook ?? cp.note ?? null,
    });
  }
  return {
    status: "success",
    actionTaken: `Captured ${matches.length} competitor post(s) as content ideas.`,
    matched: matches.length,
    runsDelta: matches.length,
    advanceWatermark: true,
  };
}

const HANDLERS: Record<AutomationTriggerType, (rule: AutomationRow, ctx: HandlerCtx) => Promise<RuleResult>> = {
  "inbox-keyword": handleInboxKeyword,
  "content-pool-queue": handleContentPoolQueue,
  "recurring-post": handleRecurringPost,
  "media-to-draft": handleMediaToDraft,
  "failed-publish-alert": handleFailedPublishAlert,
  "idea-ready-to-draft": handleIdeaReadyToDraft,
  "competitor-post-to-idea": handleCompetitorToIdea,
};

/* ------------------------------ orchestration ------------------------------ */

/** Run the general engine for one workspace using the provided client. */
export async function runEngineForWorkspace(
  client: SupabaseClient,
  workspaceId: string,
  opts: RunOpts
): Promise<RuleOutcome[]> {
  let query = client
    .from("dm_automations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .not("trigger_type", "is", null);
  if (opts.ruleId) query = query.eq("id", opts.ruleId);

  const rules = ((await query).data as AutomationRow[] | null) ?? [];
  if (rules.length === 0) return [];

  const runId = randomUUID();
  const now = new Date();
  const nowIso = now.toISOString();
  const handlerCtx: HandlerCtx = { client, workspaceId, now, nowIso, dryRun: Boolean(opts.dryRun) };
  const outcomes: RuleOutcome[] = [];

  for (const rule of rules) {
    const trigger = rule.trigger_type as AutomationTriggerType;
    const handler = HANDLERS[trigger];

    let result: RuleResult;
    if (!handler) {
      result = {
        status: "skipped",
        actionTaken: `Unknown trigger “${trigger}”.`,
        matched: 0,
        runsDelta: 0,
        advanceWatermark: false,
      };
    } else {
      try {
        result = await handler(rule, handlerCtx);
      } catch (err) {
        result = {
          status: "failed",
          actionTaken: null,
          error: err instanceof Error ? err.message : "Rule execution failed.",
          matched: 0,
          runsDelta: 0,
          advanceWatermark: false,
        };
      }
    }

    // Advance the rule's counters/watermark on a real (non-dry) run.
    if (!opts.dryRun && result.advanceWatermark) {
      const patch: Record<string, unknown> = { last_run_at: nowIso };
      if (result.runsDelta > 0) patch.runs = rule.runs + result.runsDelta;
      await client.from("dm_automations").update(patch).eq("id", rule.id).eq("workspace_id", workspaceId);
    }

    // Append a summary log. Cron suppresses noisy "skipped" rows; manual and
    // dry-run always log so the user sees a result for their click.
    const shouldLog = opts.dryRun || opts.source !== "cron" || result.status !== "skipped";
    if (shouldLog) {
      await client.from("automation_logs").insert({
        workspace_id: workspaceId,
        rule_id: rule.id,
        run_id: runId,
        status: result.status,
        action_taken: result.actionTaken,
        error_message: result.error ?? null,
      });
    }

    outcomes.push({
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: trigger,
      status: result.status,
      actionTaken: result.actionTaken,
      matched: result.matched,
    });
  }

  return outcomes;
}

function summarize(mode: "live" | "demo", outcomes: RuleOutcome[], message?: string): EngineRunSummary {
  return {
    ok: true,
    mode,
    rulesEvaluated: outcomes.length,
    actionsTaken: outcomes.filter((o) => o.status === "success").reduce((n, o) => n + o.matched, 0),
    pending: outcomes.filter((o) => o.status === "pending").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
    outcomes,
    message,
  };
}

const DEMO_SUMMARY = (message: string): EngineRunSummary =>
  summarize("demo", [], message);

/** Cron entry point — runs across all workspaces with the service-role client. */
export async function runAllWorkspacesEngine(): Promise<EngineRunSummary> {
  const admin = createAdminClient();
  if (!admin) return DEMO_SUMMARY("Service role not configured — engine is a no-op.");

  const { data } = await admin
    .from("dm_automations")
    .select("workspace_id")
    .eq("active", true)
    .not("trigger_type", "is", null);
  const workspaces = [
    ...new Set(((data as { workspace_id: string }[] | null) ?? []).map((r) => r.workspace_id)),
  ];

  const outcomes: RuleOutcome[] = [];
  for (const ws of workspaces) {
    outcomes.push(...(await runEngineForWorkspace(admin, ws, { source: "cron" })));
  }
  return summarize("live", outcomes);
}

/** Manual "Run now" for the active workspace (session client). Demo-safe. */
export async function runCurrentWorkspaceEngine(): Promise<EngineRunSummary> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return DEMO_SUMMARY("Demo mode — connect a workspace to run automations live.");
  }
  const outcomes = await runEngineForWorkspace(ctx.supabase, ctx.workspaceId, { source: "manual" });
  return summarize("live", outcomes, outcomes.length === 0 ? "No active rules to run." : undefined);
}

/** Dry-run a single rule for the active workspace (no writes besides the log). */
export async function dryRunRule(ruleId: string): Promise<EngineRunSummary> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return DEMO_SUMMARY("Demo mode — dry-run is available once a workspace is connected.");
  }
  const outcomes = await runEngineForWorkspace(ctx.supabase, ctx.workspaceId, {
    ruleId,
    dryRun: true,
    source: "dry-run",
  });
  return summarize(
    "live",
    outcomes,
    outcomes.length === 0 ? "Rule not found, inactive, or not a general rule." : undefined
  );
}
