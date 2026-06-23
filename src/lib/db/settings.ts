import "server-only";
import { getDbContext, isLive, requireLiveContext } from "@/lib/db/context";
import type { SettingsRow, ConnectedAccountRow } from "@/lib/db/types";
import { settingsDefaults } from "@/lib/demo-data";

/** Demo-facing settings shape (matches `@/lib/demo-data` `settingsDefaults`). */
export type MappedSettings = typeof settingsDefaults;

function mapSettings(row: SettingsRow): MappedSettings {
  return {
    brandName: row.brand_name ?? settingsDefaults.brandName,
    tagline: row.tagline ?? settingsDefaults.tagline,
    defaultTone: row.default_tone ?? settingsDefaults.defaultTone,
    defaultCTA: row.default_cta ?? settingsDefaults.defaultCTA,
    defaultHashtags: row.default_hashtags ?? settingsDefaults.defaultHashtags,
    aiProvider: row.ai_provider ?? settingsDefaults.aiProvider,
    webhookUrl: row.webhook_url ?? settingsDefaults.webhookUrl,
    timezone: row.timezone ?? settingsDefaults.timezone,
    postingPrefs: {
      ...settingsDefaults.postingPrefs,
      ...((row.posting_prefs as Partial<MappedSettings["postingPrefs"]> | null) ?? {}),
    },
    notificationPrefs: {
      ...settingsDefaults.notificationPrefs,
      ...((row.notification_prefs as Record<string, boolean> | null) ?? {}),
    },
  };
}

/** Workspace settings shaped like demo `settingsDefaults`. Demo fallback. */
export async function getSettings(): Promise<MappedSettings> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return settingsDefaults;

  const { data, error } = await ctx.supabase
    .from("settings")
    .select("*")
    .eq("workspace_id", ctx.workspaceId)
    .maybeSingle();

  // Live but the row is missing/errored — return neutral values, not the demo
  // brand ("Rivera Studio"), so a real workspace never shows demo identity.
  if (error || !data) return { ...settingsDefaults, brandName: "", tagline: "" };
  return mapSettings(data as SettingsRow);
}

export interface UpdateSettingsInput {
  brandName?: string | null;
  tagline?: string | null;
  defaultTone?: string | null;
  defaultCTA?: string | null;
  defaultHashtags?: string | null;
  aiProvider?: string | null;
  webhookUrl?: string | null;
  timezone?: string | null;
  postingPrefs?: MappedSettings["postingPrefs"];
  notificationPrefs?: Record<string, boolean>;
}

/** Upserts the workspace's single settings row (keyed by workspace_id). */
export async function updateSettings(
  input: UpdateSettingsInput
): Promise<SettingsRow> {
  const ctx = await requireLiveContext();
  const patch: Record<string, unknown> = { workspace_id: ctx.workspaceId };
  if (input.brandName !== undefined) patch.brand_name = input.brandName;
  if (input.tagline !== undefined) patch.tagline = input.tagline;
  if (input.defaultTone !== undefined) patch.default_tone = input.defaultTone;
  if (input.defaultCTA !== undefined) patch.default_cta = input.defaultCTA;
  if (input.defaultHashtags !== undefined)
    patch.default_hashtags = input.defaultHashtags;
  if (input.aiProvider !== undefined) patch.ai_provider = input.aiProvider;
  if (input.webhookUrl !== undefined) patch.webhook_url = input.webhookUrl;
  if (input.timezone !== undefined) patch.timezone = input.timezone;
  if (input.postingPrefs !== undefined) patch.posting_prefs = input.postingPrefs;
  if (input.notificationPrefs !== undefined)
    patch.notification_prefs = input.notificationPrefs;

  const { data, error } = await ctx.supabase
    .from("settings")
    .upsert(patch, { onConflict: "workspace_id" })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update settings.");
  return data as SettingsRow;
}

/**
 * Connected integration accounts (with granted permissions for display). Empty-
 * array fallback in demo mode. Only the scope/permission names are surfaced —
 * never the encrypted tokens, which stay server-only.
 */
export type MappedConnectedAccount = Pick<
  ConnectedAccountRow,
  "id" | "platform" | "account_name" | "account_handle" | "status" | "last_sync_at"
> & { permissions: string[] };

export async function listConnectedAccounts(): Promise<MappedConnectedAccount[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return [];

  const { data, error } = await ctx.supabase
    .from("connected_accounts")
    .select("id, platform, account_name, account_handle, status, last_sync_at")
    .eq("workspace_id", ctx.workspaceId)
    .order("platform", { ascending: true });

  if (error || !data) return [];

  // Attach granted permissions per account (best-effort; scope names only).
  const { data: perms } = await ctx.supabase
    .from("platform_permissions")
    .select("connected_account_id, permission, granted")
    .eq("workspace_id", ctx.workspaceId);

  const byAccount = new Map<string, string[]>();
  for (const p of (perms ?? []) as {
    connected_account_id: string | null;
    permission: string;
    granted: boolean;
  }[]) {
    if (!p.granted || !p.connected_account_id) continue;
    const list = byAccount.get(p.connected_account_id) ?? [];
    list.push(p.permission);
    byAccount.set(p.connected_account_id, list);
  }

  return (data as Omit<MappedConnectedAccount, "permissions">[]).map((a) => ({
    ...a,
    permissions: byAccount.get(a.id) ?? [],
  }));
}

export interface ConnectedAccountInput {
  accountName?: string | null;
  accountHandle?: string | null;
  externalId?: string | null;
  status?: ConnectedAccountRow["status"];
  lastSyncAt?: string | null;
}

/** Upserts a connected account for a platform within the workspace. */
export async function upsertConnectedAccount(
  platform: string,
  input: ConnectedAccountInput
): Promise<ConnectedAccountRow> {
  const ctx = await requireLiveContext();

  const { data: existing } = await ctx.supabase
    .from("connected_accounts")
    .select("id")
    .eq("workspace_id", ctx.workspaceId)
    .eq("platform", platform)
    .maybeSingle();

  const fields: Record<string, unknown> = {
    workspace_id: ctx.workspaceId,
    platform,
    connected_by: ctx.userId,
  };
  if (input.accountName !== undefined) fields.account_name = input.accountName;
  if (input.accountHandle !== undefined) fields.account_handle = input.accountHandle;
  if (input.externalId !== undefined) fields.external_id = input.externalId;
  if (input.status !== undefined) fields.status = input.status;
  if (input.lastSyncAt !== undefined) fields.last_sync_at = input.lastSyncAt;

  if (existing?.id) {
    const { data, error } = await ctx.supabase
      .from("connected_accounts")
      .update(fields)
      .eq("id", existing.id)
      .eq("workspace_id", ctx.workspaceId)
      .select("*")
      .single();
    if (error || !data)
      throw error ?? new Error("Failed to update connected account.");
    return data as ConnectedAccountRow;
  }

  const { data, error } = await ctx.supabase
    .from("connected_accounts")
    .insert(fields)
    .select("*")
    .single();
  if (error || !data)
    throw error ?? new Error("Failed to create connected account.");
  return data as ConnectedAccountRow;
}

export async function setConnectionStatus(
  id: string,
  status: ConnectedAccountRow["status"]
): Promise<ConnectedAccountRow> {
  const ctx = await requireLiveContext();
  const { data, error } = await ctx.supabase
    .from("connected_accounts")
    .update({ status })
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select("*")
    .single();
  if (error || !data)
    throw error ?? new Error("Failed to set connection status.");
  return data as ConnectedAccountRow;
}
