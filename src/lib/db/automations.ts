import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type {
  AutomationRow,
  AutomationLogRow,
  AutomationTriggerType,
  AutomationActionType,
} from "@/lib/db/types";
import { automations as demoAutomations, automationLogs as demoLogs } from "@/lib/demo-data";

/** Demo-facing automation shape consumed by the Automations UI. */
export interface AutomationListItem {
  id: string;
  name: string;
  /** Legacy DM type (back-compat); general rules use `triggerType`. */
  type: AutomationRow["type"];
  triggerType: AutomationTriggerType | null;
  actionType: AutomationActionType | null;
  description: string;
  trigger: string;
  conditions: Record<string, unknown>;
  actionConfig: Record<string, unknown>;
  active: boolean;
  requiresApproval: boolean;
  runs: number;
  lastRun: string;
}

/** A flattened automation log row for the logs table. */
export interface AutomationLogItem {
  id: string;
  rule: string;
  event: string;
  status: AutomationLogRow["status"];
  time: string;
}

/** Compact relative time (e.g. "26m ago", "4h ago", "2d ago"). */
function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const diffMs = Date.now() - then;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  return `${wk}w ago`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapAutomation(row: AutomationRow): AutomationListItem {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    triggerType: row.trigger_type ?? null,
    actionType: row.action_type ?? null,
    description: row.description ?? "",
    trigger: row.trigger ?? "",
    conditions: asRecord(row.conditions),
    actionConfig: asRecord(row.action_config),
    active: row.active,
    requiresApproval: row.requires_approval,
    runs: row.runs,
    lastRun: relativeTime(row.last_run_at),
  };
}

/** Map the demo automations into the general list shape (legacy DM rules). */
function demoListItems(): AutomationListItem[] {
  return demoAutomations.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    triggerType: null,
    actionType: null,
    description: a.description,
    trigger: a.trigger,
    conditions: {},
    actionConfig: {},
    active: a.active,
    requiresApproval: a.requiresApproval,
    runs: a.runs,
    lastRun: a.lastRun,
  }));
}

/** Automation definitions for the active workspace. Demo fallback. */
export async function listAutomations(): Promise<AutomationListItem[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoListItems();

  const { data, error } = await ctx.supabase
    .from("dm_automations")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as AutomationRow[]).map(mapAutomation);
}

/** Recent automation run log for the active workspace. Demo fallback. */
export async function listAutomationLogs(limit = 50): Promise<AutomationLogItem[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return demoLogs.map((l) => ({
      id: l.id,
      rule: l.automation,
      event: l.event,
      status: l.status,
      time: l.time,
    }));
  }

  const { data, error } = await ctx.supabase
    .from("automation_logs")
    .select("*, dm_automations:rule_id(name)")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  type LogWithRule = AutomationLogRow & { dm_automations: { name: string } | null };
  return (data as LogWithRule[]).map((row) => ({
    id: row.id,
    rule: row.dm_automations?.name ?? "Automation",
    event: row.action_taken ?? row.error_message ?? "—",
    status: row.status,
    time: relativeTime(row.created_at),
  }));
}

export interface AutomationStats {
  /** Inbox items awaiting review (comments_inbox status='new'). */
  pendingApprovals: number;
  /** Pending automation actions awaiting approval. */
  pendingActions: number;
  /** Total runs across lead-capture automations. */
  leadsCaptured: number;
}

/**
 * Live counters for the automations dashboard. Demo/preview returns
 * representative figures so the cards render without auth.
 */
export async function getAutomationStats(): Promise<AutomationStats> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return { pendingApprovals: 3, pendingActions: 2, leadsCaptured: 248 };

  const [inboxRes, pendingRes, leadRes] = await Promise.all([
    ctx.supabase
      .from("comments_inbox")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspaceId)
      .eq("status", "new"),
    ctx.supabase
      .from("automation_logs")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspaceId)
      .eq("status", "pending"),
    ctx.supabase
      .from("dm_automations")
      .select("runs")
      .eq("workspace_id", ctx.workspaceId)
      .eq("type", "lead-capture"),
  ]);

  const pendingApprovals = inboxRes.count ?? 0;
  const pendingActions = pendingRes.count ?? 0;
  const leadsCaptured = ((leadRes.data as { runs: number }[] | null) ?? []).reduce(
    (sum, r) => sum + (r.runs ?? 0),
    0
  );
  return { pendingApprovals, pendingActions, leadsCaptured };
}

export interface CreateAutomationInput {
  name: string;
  type?: AutomationRow["type"];
  triggerType?: AutomationTriggerType | null;
  actionType?: AutomationActionType | null;
  description?: string | null;
  trigger?: string | null;
  conditions?: Record<string, unknown>;
  actionConfig?: Record<string, unknown>;
  active?: boolean;
  requiresApproval?: boolean;
}

export async function createAutomation(
  input: CreateAutomationInput
): Promise<AutomationRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("dm_automations")
    .insert({
      workspace_id: ctx.workspaceId,
      created_by: ctx.userId,
      name: input.name,
      type: input.type ?? "dm-keyword",
      trigger_type: input.triggerType ?? null,
      action_type: input.actionType ?? null,
      description: input.description ?? null,
      trigger: input.trigger ?? null,
      conditions: input.conditions ?? {},
      action_config: input.actionConfig ?? {},
      active: input.active ?? false,
      requires_approval: input.requiresApproval ?? true,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create automation.");
  return data as AutomationRow;
}

export async function updateAutomation(
  id: string,
  input: Partial<CreateAutomationInput>
): Promise<AutomationRow> {
  const ctx = await requireLiveContext();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.type !== undefined) patch.type = input.type;
  if (input.triggerType !== undefined) patch.trigger_type = input.triggerType;
  if (input.actionType !== undefined) patch.action_type = input.actionType;
  if (input.description !== undefined) patch.description = input.description;
  if (input.trigger !== undefined) patch.trigger = input.trigger;
  if (input.conditions !== undefined) patch.conditions = input.conditions;
  if (input.actionConfig !== undefined) patch.action_config = input.actionConfig;
  if (input.active !== undefined) patch.active = input.active;
  if (input.requiresApproval !== undefined)
    patch.requires_approval = input.requiresApproval;

  const { data, error } = await ctx.supabase
    .from("dm_automations")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update automation.");
  return data as AutomationRow;
}

export async function toggleAutomationActive(
  id: string,
  active: boolean
): Promise<AutomationRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("dm_automations")
    .update({ active })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to toggle automation.");
  return data as AutomationRow;
}

export async function toggleAutomationApproval(
  id: string,
  requiresApproval: boolean
): Promise<AutomationRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("dm_automations")
    .update({ requires_approval: requiresApproval })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data)
    throw error ?? new Error("Failed to toggle automation approval.");
  return data as AutomationRow;
}

export async function deleteAutomation(id: string): Promise<string> {
  const ctx = await requireLiveContext();
  const { error } = await ctx.supabase
    .from("dm_automations")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId);
  if (error) throw error;
  return id;
}
