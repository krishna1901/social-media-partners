import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDbContext, isLive } from "@/lib/db/context";
import type { AutomationRow, InboxRow } from "@/lib/db/types";

/**
 * Phase 6 — automation execution engine.
 *
 * Evaluates a workspace's ACTIVE automations against new `comments_inbox` items
 * and acts on matches: it composes a reply draft and, when the automation does
 * not require approval, marks the item handled (auto-reply). Items that need
 * approval keep `status='new'` with a populated `reply_draft` for the human to
 * review/send from the inbox. Each automation's `runs` + `last_run_at` are
 * updated. Idempotent: only items WITHOUT a draft are considered, so re-runs
 * never re-action the same item.
 *
 * Mirrors the inbox/publishing runner pattern: a per-workspace core plus a
 * service-role (cron) and session (manual) wrapper. Demo/preview is a no-op.
 */

export interface AutomationRunSummary {
  ok: boolean;
  mode: "live" | "demo";
  /** Active automations evaluated. */
  automations: number;
  /** Inbox items actioned. */
  matched: number;
  /** Drafted and left for human approval. */
  drafted: number;
  /** Auto-replied (no approval required). */
  autoHandled: number;
  message?: string;
}

const ITEM_SCAN_LIMIT = 200;

/** Pull a keyword from a trigger like "Keyword: TEMPLATE" (falls back to a bare trigger word). */
function extractKeyword(automation: AutomationRow): string | null {
  const t = (automation.trigger ?? "").trim();
  if (!t) return null;
  const m = t.match(/keyword\s*:\s*(.+)/i);
  if (m) return m[1].trim().toLowerCase();
  // A short bare trigger ("TEMPLATE") is treated as the keyword.
  return t.length <= 40 ? t.toLowerCase() : null;
}

/** Which inbox item types an automation type listens to. */
function typesFor(type: AutomationRow["type"]): InboxRow["type"][] {
  if (type === "dm-keyword") return ["dm", "comment"];
  if (type === "comment-reply") return ["comment"];
  return ["comment", "dm", "mention"]; // lead-capture: any surface
}

/** Compose a reply/handling draft for a matched item. */
function composeReply(automation: AutomationRow, item: InboxRow): string {
  const who = item.author_handle || item.author_name || "there";
  const detail = automation.description?.trim();
  switch (automation.type) {
    case "lead-capture":
      return `Thanks ${who}! Sending that over now — keep an eye on your DMs.${detail ? ` ${detail}` : ""}`;
    case "comment-reply":
      return `Appreciate you, ${who}! 🙌${detail ? ` ${detail}` : " Thanks for the comment — more coming soon."}`;
    case "dm-keyword":
    default:
      return `Hey ${who}! Here's what you asked for 👇${detail ? ` ${detail}` : " Sending the details now."}`;
  }
}

/** Run automations for one workspace using the provided client. */
export async function runWorkspaceAutomations(
  client: SupabaseClient,
  workspaceId: string
): Promise<{ automations: number; matched: number; drafted: number; autoHandled: number }> {
  const { data: autoData } = await client
    .from("dm_automations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true);
  const automations = (autoData as AutomationRow[] | null) ?? [];
  if (automations.length === 0) {
    return { automations: 0, matched: 0, drafted: 0, autoHandled: 0 };
  }

  // New, un-actioned inbox items (no draft yet).
  const { data: itemData } = await client
    .from("comments_inbox")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "new")
    .is("reply_draft", null)
    .order("received_at", { ascending: true, nullsFirst: true })
    .limit(ITEM_SCAN_LIMIT);
  const inbox = (itemData as InboxRow[] | null) ?? [];
  if (inbox.length === 0) {
    return { automations: automations.length, matched: 0, drafted: 0, autoHandled: 0 };
  }

  const claimed = new Set<string>();
  let matched = 0;
  let drafted = 0;
  let autoHandled = 0;

  for (const automation of automations) {
    const keyword = extractKeyword(automation);
    const listenTypes = typesFor(automation.type);
    let actionedForThis = 0;

    for (const item of inbox) {
      if (claimed.has(item.id)) continue;
      if (!listenTypes.includes(item.type)) continue;

      const content = (item.content ?? "").toLowerCase();
      if (keyword) {
        if (!content.includes(keyword)) continue;
      } else if (automation.type !== "comment-reply") {
        // Keyword-based types need a keyword to match on.
        continue;
      }

      const reply = composeReply(automation, item);
      const autoSend = !automation.requires_approval;
      const patch: Record<string, unknown> = {
        reply_draft: reply,
        suggested_reply: reply,
        updated_at: new Date().toISOString(),
      };
      if (autoSend) patch.status = "replied";

      const { error } = await client
        .from("comments_inbox")
        .update(patch)
        .eq("id", item.id)
        .eq("workspace_id", workspaceId);
      if (error) continue;

      claimed.add(item.id);
      matched++;
      actionedForThis++;
      if (autoSend) autoHandled++;
      else drafted++;
    }

    if (actionedForThis > 0) {
      await client
        .from("dm_automations")
        .update({ runs: automation.runs + actionedForThis, last_run_at: new Date().toISOString() })
        .eq("id", automation.id)
        .eq("workspace_id", workspaceId);
    }
  }

  return { automations: automations.length, matched, drafted, autoHandled };
}

/** Manual trigger for the active workspace (session client). Demo-safe no-op. */
export async function runCurrentWorkspaceAutomations(): Promise<AutomationRunSummary> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return {
      ok: true,
      mode: "demo",
      automations: 0,
      matched: 0,
      drafted: 0,
      autoHandled: 0,
      message: "Demo mode — connect a workspace to run automations live.",
    };
  }
  const r = await runWorkspaceAutomations(ctx.supabase, ctx.workspaceId);
  return {
    ok: true,
    mode: "live",
    ...r,
    message: r.automations === 0 ? "No active automations to run." : undefined,
  };
}

/** Cron trigger across all workspaces (service-role). No-op without service role. */
export async function runAllWorkspacesAutomations(): Promise<AutomationRunSummary> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: true,
      mode: "demo",
      automations: 0,
      matched: 0,
      drafted: 0,
      autoHandled: 0,
      message: "Service role not configured.",
    };
  }

  const { data } = await admin
    .from("dm_automations")
    .select("workspace_id")
    .eq("active", true);
  const workspaces = [
    ...new Set(((data as { workspace_id: string }[] | null) ?? []).map((r) => r.workspace_id)),
  ];

  let automations = 0;
  let matched = 0;
  let drafted = 0;
  let autoHandled = 0;
  for (const ws of workspaces) {
    const r = await runWorkspaceAutomations(admin, ws);
    automations += r.automations;
    matched += r.matched;
    drafted += r.drafted;
    autoHandled += r.autoHandled;
  }
  return { ok: true, mode: "live", automations, matched, drafted, autoHandled };
}
