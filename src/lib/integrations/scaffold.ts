import "server-only";
import { createHash } from "crypto";

/**
 * Phase 3G — OAuth scaffolding for additional platforms (YouTube, TikTok, X).
 *
 * A small registry + helpers that drive the generic `/api/oauth/[provider]/*`
 * routes. These connect accounts and store encrypted tokens using the same
 * pattern as LinkedIn/Meta. Real *publishing* is implemented as of Phase 6
 * (`src/lib/integrations/{x,tiktok,youtube}.ts`), but live posting still requires
 * each platform's approval (TikTok content-posting audit, X paid API tier,
 * YouTube upload scope); until connected, the runner simulates.
 *
 * LinkedIn and Meta keep their dedicated routes (static segments take
 * precedence over `[provider]`), so this registry only covers the new three.
 */

export type ScaffoldId = "youtube" | "tiktok" | "x";

interface ScaffoldProvider {
  id: ScaffoldId;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Param name for the client id in the authorize URL (TikTok uses client_key). */
  clientIdParam: "client_id" | "client_key";
  /** How client credentials are sent to the token endpoint. */
  tokenAuth: "body" | "basic";
  /** Whether the provider requires PKCE (X). */
  pkce: boolean;
  /** Extra static authorize params (e.g. Google offline access). */
  extraAuthParams?: Record<string, string>;
}

const REGISTRY: Record<ScaffoldId, ScaffoldProvider> = {
  youtube: {
    id: "youtube",
    label: "YouTube",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/youtube.upload openid",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    clientIdParam: "client_id",
    tokenAuth: "body",
    pkce: false,
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: "user.info.basic,video.publish",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    clientIdParam: "client_key",
    tokenAuth: "body",
    pkce: false,
  },
  x: {
    id: "x",
    label: "X",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    scopes: "tweet.read tweet.write users.read offline.access",
    clientIdEnv: "X_CLIENT_ID",
    clientSecretEnv: "X_CLIENT_SECRET",
    clientIdParam: "client_id",
    tokenAuth: "basic",
    pkce: true,
  },
};

export function isScaffoldId(id: string): id is ScaffoldId {
  return id === "youtube" || id === "tiktok" || id === "x";
}

export function getProvider(id: ScaffoldId): ScaffoldProvider {
  return REGISTRY[id];
}

function clientId(p: ScaffoldProvider): string | undefined {
  return process.env[p.clientIdEnv];
}
function clientSecret(p: ScaffoldProvider): string | undefined {
  return process.env[p.clientSecretEnv];
}

export function isProviderConfigured(id: ScaffoldId): boolean {
  const p = REGISTRY[id];
  return Boolean(clientId(p) && clientSecret(p));
}

/** Which scaffolded providers are configured (for the integrations UI). */
export function configuredScaffoldProviders(): ScaffoldId[] {
  return (Object.keys(REGISTRY) as ScaffoldId[]).filter(isProviderConfigured);
}

export function redirectUri(id: ScaffoldId): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/oauth/${id}/callback`;
}

function base64Url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PKCE S256 challenge from a verifier. */
export function pkceChallenge(verifier: string): string {
  return base64Url(createHash("sha256").update(verifier).digest());
}

/** Build the authorize URL. Pass a PKCE challenge for providers that need it. */
export function buildAuthUrl(id: ScaffoldId, state: string, challenge?: string): string {
  const p = REGISTRY[id];
  const params = new URLSearchParams({
    response_type: "code",
    [p.clientIdParam]: clientId(p) as string,
    redirect_uri: redirectUri(id),
    scope: p.scopes,
    state,
    ...(p.extraAuthParams ?? {}),
  });
  if (p.pkce && challenge) {
    params.set("code_challenge", challenge);
    params.set("code_challenge_method", "S256");
  }
  return `${p.authorizeUrl}?${params.toString()}`;
}

export interface ScaffoldToken {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

/** Exchange an authorization code for a token (handles per-provider quirks). */
export async function exchangeCode(
  id: ScaffoldId,
  code: string,
  verifier?: string
): Promise<ScaffoldToken> {
  const p = REGISTRY[id];
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(id),
  });
  if (p.pkce && verifier) body.set("code_verifier", verifier);

  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  if (p.tokenAuth === "basic") {
    const creds = Buffer.from(`${clientId(p)}:${clientSecret(p)}`).toString("base64");
    headers.authorization = `Basic ${creds}`;
    // X also wants client_id present in the body for confidential clients.
    body.set("client_id", clientId(p) as string);
  } else {
    body.set(p.clientIdParam, clientId(p) as string);
    body.set("client_secret", clientSecret(p) as string);
  }

  const res = await fetch(p.tokenUrl, { method: "POST", headers, body });
  if (!res.ok) {
    throw new Error(`${p.label} token exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? 0,
  };
}

/**
 * Refresh an access token using a stored refresh token (Phase 6). Mirrors the
 * per-provider auth quirks of `exchangeCode`. Used by the publishers for the
 * short-lived X / Google access tokens.
 */
export async function refreshAccessToken(
  id: ScaffoldId,
  refreshToken: string
): Promise<ScaffoldToken> {
  const p = REGISTRY[id];
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });

  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  if (p.tokenAuth === "basic") {
    const creds = Buffer.from(`${clientId(p)}:${clientSecret(p)}`).toString("base64");
    headers.authorization = `Basic ${creds}`;
    body.set("client_id", clientId(p) as string);
  } else {
    body.set(p.clientIdParam, clientId(p) as string);
    body.set("client_secret", clientSecret(p) as string);
  }

  const res = await fetch(p.tokenUrl, { method: "POST", headers, body });
  if (!res.ok) {
    throw new Error(`${p.label} token refresh failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? 0,
  };
}
