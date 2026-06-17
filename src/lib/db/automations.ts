import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { AutomationRow } from "@/lib/db/types";
import { automations as demoAutomations } from "@/lib/demo-data";

export type MappedAutomation = (typeof demoAutomations)[number];

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

function mapAutomation(row: AutomationRow): MappedAutomation {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description ?? "",
    trigger: row.trigger ?? "",
    active: row.active,
    requiresApproval: row.requires_approval,
    runs: row.runs,
    lastRun: relativeTime(row.last_run_at),
  };
}

/** Automation definitions shaped like demo `automations`. Demo fallback. */
export async function listAutomations(): Promise<MappedAutomation[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return demoAutomations;

  const { data, error } = await ctx.supabase
    .from("dm_automations")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as AutomationRow[]).map(mapAutomation);
}

export interface CreateAutomationInput {
  name: string;
  type?: AutomationRow["type"];
  description?: string | null;
  trigger?: string | null;
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
      description: input.description ?? null,
      trigger: input.trigger ?? null,
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
  if (input.description !== undefined) patch.description = input.description;
  if (input.trigger !== undefined) patch.trigger = input.trigger;
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
