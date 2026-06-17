import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDecryptedToken,
  updateConnectionTokens,
  type DecryptedToken,
} from "@/lib/db/social-tokens";
import {
  refreshAccessToken,
  isProviderConfigured,
  type ScaffoldId,
} from "@/lib/integrations/scaffold";

/** Refresh a token this far before its actual expiry (clock skew margin). */
const EXPIRY_BUFFER_MS = 60_000;

/**
 * Phase 6 — decrypted token for a scaffold provider (X / TikTok / YouTube),
 * transparently refreshed when expired and a refresh token + client creds exist.
 * The refreshed token is persisted so the next run reuses it. Falls back to the
 * existing token if refresh fails (the publish call can still surface the error).
 */
export async function getFreshScaffoldToken(
  client: SupabaseClient,
  workspaceId: string,
  providerId: ScaffoldId
): Promise<DecryptedToken | null> {
  const token = await getDecryptedToken(client, workspaceId, providerId);
  if (!token) return null;

  const expired = token.expiresAt
    ? new Date(token.expiresAt).getTime() <= Date.now() + EXPIRY_BUFFER_MS
    : false;
  if (!expired || !token.refreshToken || !isProviderConfigured(providerId)) return token;

  try {
    const r = await refreshAccessToken(providerId, token.refreshToken);
    const expiresAt = r.expiresIn ? new Date(Date.now() + r.expiresIn * 1000).toISOString() : null;
    const refreshToken = r.refreshToken ?? token.refreshToken;
    await updateConnectionTokens(client, workspaceId, providerId, {
      accessToken: r.accessToken,
      refreshToken,
      expiresAt,
    });
    return { ...token, accessToken: r.accessToken, refreshToken, expiresAt };
  } catch {
    return token;
  }
}
