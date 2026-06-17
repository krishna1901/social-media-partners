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

  if (error || !data) return settingsDefaults;
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

  const { data, error } = await ctx.supabase
    .from("settings")
    .upsert(patch, { onConflict: "workspace_id" })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update settings.");
  return data as SettingsRow;
}

/** Connected integration accounts. Empty-array fallback in demo mode. */
export type MappedConnectedAccount = Pick<
  ConnectedAccountRow,
  "id" | "platform" | "account_name" | "account_handle" | "status" | "last_sync_at"
>;

export async function listConnectedAccounts(): Promise<MappedConnectedAccount[]> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return [];

  const { data, error } = await ctx.supabase
    .from("connected_accounts")
    .select("id, platform, account_name, account_handle, status, last_sync_at")
    .eq("workspace_id", ctx.workspaceId)
    .order("platform", { ascending: true });

  if (error || !data) return [];
  return data as MappedConnectedAccount[];
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
