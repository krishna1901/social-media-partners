import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptSecret, decryptSecret, isEncryptionConfigured } from "@/lib/security/crypto";

/**
 * Server-only access to OAuth tokens stored in `social_tokens`.
 *
 * Access tokens are encrypted at rest with `TOKEN_ENCRYPTION_KEY` (AES-256-GCM).
 * Functions take an explicit Supabase client so both the user-session path
 * (OAuth callback, RLS-scoped) and the service-role path (cron runner) can reuse
 * them. NEVER expose tokens to the client.
 */

export interface StoreTokenInput {
  workspaceId: string;
  userId: string | null;
  platform: string;
  accountName?: string | null;
  accountHandle?: string | null;
  externalId?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  scope?: string | null;
  expiresAt?: string | null;
}

export interface DecryptedToken {
  accessToken: string;
  refreshToken: string | null;
  externalId: string | null;
  scope: string | null;
  expiresAt: string | null;
}

export { isEncryptionConfigured };

/**
 * Upsert a connected account + its (encrypted) token for a platform. Marks the
 * account 'connected'. Returns the connected_account id.
 */
export async function storeConnection(
  client: SupabaseClient,
  input: StoreTokenInput
): Promise<string> {
  if (!isEncryptionConfigured()) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be set to store OAuth tokens.");
  }

  // 1. Upsert the connected_accounts row.
  const { data: existing } = await client
    .from("connected_accounts")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("platform", input.platform)
    .maybeSingle();

  const accountFields = {
    workspace_id: input.workspaceId,
    platform: input.platform,
    account_name: input.accountName ?? null,
    account_handle: input.accountHandle ?? null,
    external_id: input.externalId ?? null,
    status: "connected" as const,
    connected_by: input.userId,
    last_sync_at: new Date().toISOString(),
  };

  let accountId: string;
  if (existing?.id) {
    const { data, error } = await client
      .from("connected_accounts")
      .update(accountFields)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("Failed to update connected account.");
    accountId = data.id as string;
  } else {
    const { data, error } = await client
      .from("connected_accounts")
      .insert(accountFields)
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("Failed to create connected account.");
    accountId = data.id as string;
  }

  // 2. Upsert the encrypted token (one row per connected_account).
  const tokenFields = {
    workspace_id: input.workspaceId,
    connected_account_id: accountId,
    access_token: encryptSecret(input.accessToken),
    refresh_token: input.refreshToken ? encryptSecret(input.refreshToken) : null,
    scope: input.scope ?? null,
    expires_at: input.expiresAt ?? null,
  };

  const { data: existingToken } = await client
    .from("social_tokens")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("connected_account_id", accountId)
    .maybeSingle();

  if (existingToken?.id) {
    const { error } = await client
      .from("social_tokens")
      .update(tokenFields)
      .eq("id", existingToken.id);
    if (error) throw error;
  } else {
    const { error } = await client.from("social_tokens").insert(tokenFields);
    if (error) throw error;
  }

  return accountId;
}

/**
 * Fetch + decrypt the stored token for a connected platform in a workspace.
 * Returns null when not connected or no token row exists.
 */
export async function getDecryptedToken(
  client: SupabaseClient,
  workspaceId: string,
  platform: string
): Promise<DecryptedToken | null> {
  if (!isEncryptionConfigured()) return null;

  const { data: account } = await client
    .from("connected_accounts")
    .select("id, external_id, status")
    .eq("workspace_id", workspaceId)
    .eq("platform", platform)
    .maybeSingle();
  if (!account || account.status !== "connected") return null;

  const { data: token } = await client
    .from("social_tokens")
    .select("access_token, refresh_token, scope, expires_at")
    .eq("workspace_id", workspaceId)
    .eq("connected_account_id", account.id)
    .maybeSingle();
  if (!token?.access_token) return null;

  try {
    return {
      accessToken: decryptSecret(token.access_token as string),
      refreshToken: token.refresh_token ? decryptSecret(token.refresh_token as string) : null,
      externalId: (account.external_id as string | null) ?? null,
      scope: (token.scope as string | null) ?? null,
      expiresAt: (token.expires_at as string | null) ?? null,
    };
  } catch {
    return null; // key rotated / tampered — treat as not connected
  }
}

/**
 * Update just the stored token for a connected platform (e.g. after an OAuth
 * refresh). Encrypts the new secrets in place; no-op when not connected or
 * encryption isn't configured.
 */
export async function updateConnectionTokens(
  client: SupabaseClient,
  workspaceId: string,
  platform: string,
  t: { accessToken: string; refreshToken?: string | null; expiresAt?: string | null }
): Promise<void> {
  if (!isEncryptionConfigured()) return;

  const { data: account } = await client
    .from("connected_accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform", platform)
    .maybeSingle();
  if (!account?.id) return;

  const patch: Record<string, unknown> = {
    access_token: encryptSecret(t.accessToken),
    updated_at: new Date().toISOString(),
  };
  if (t.refreshToken) patch.refresh_token = encryptSecret(t.refreshToken);
  if (t.expiresAt !== undefined) patch.expires_at = t.expiresAt;

  await client
    .from("social_tokens")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .eq("connected_account_id", account.id);
}

/** Remove a platform connection (account + token) from a workspace. */
export async function removeConnection(
  client: SupabaseClient,
  workspaceId: string,
  platform: string
): Promise<void> {
  const { data: account } = await client
    .from("connected_accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform", platform)
    .maybeSingle();
  if (!account?.id) return;

  await client
    .from("social_tokens")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("connected_account_id", account.id);
  await client
    .from("connected_accounts")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", account.id);
}
