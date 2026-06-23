import "server-only";
import { getPlatformSecret } from "@/lib/platform/secrets";

/**
 * LinkedIn integration client — dependency-free server-side `fetch`.
 *
 * OAuth 2.0 (Authorization Code) + the LinkedIn Posts API for publishing as a
 * member. All network I/O lives here; keys come from server-only env. When not
 * configured (`LINKEDIN_CLIENT_ID`/`SECRET` absent), callers short-circuit so
 * demo/preview never makes a network call.
 *
 * Docs: OAuth (https://learn.microsoft.com/linkedin/shared/authentication/authorization-code-flow),
 * Posts API (https://learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api).
 */

const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_VERSION = "202401";

/** Scopes for signing in + posting as the member. */
export const LINKEDIN_SCOPES = ["openid", "profile", "email", "w_member_social"];

export async function isLinkedInConfigured(): Promise<boolean> {
  const [id, secret] = await Promise.all([
    getPlatformSecret("LINKEDIN_CLIENT_ID"),
    getPlatformSecret("LINKEDIN_CLIENT_SECRET"),
  ]);
  return Boolean(id && secret);
}

/**
 * Redirect URI for the OAuth callback. Honors an explicit `LINKEDIN_REDIRECT_URI`
 * override (must match the value registered in the LinkedIn app); otherwise it's
 * derived from the app URL.
 */
export function linkedinRedirectUri(): string {
  const override = process.env.LINKEDIN_REDIRECT_URI?.trim();
  if (override) return override;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/oauth/linkedin/callback`;
}

/** Build the LinkedIn authorization URL for the consent screen. */
export async function buildAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: (await getPlatformSecret("LINKEDIN_CLIENT_ID")) as string,
    redirect_uri: linkedinRedirectUri(),
    state,
    scope: LINKEDIN_SCOPES.join(" "),
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface LinkedInToken {
  accessToken: string;
  expiresIn: number;
  refreshToken: string | null;
  scope: string | null;
}

/** Exchange an authorization code for an access token. */
export async function exchangeCode(code: string): Promise<LinkedInToken> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: linkedinRedirectUri(),
      client_id: (await getPlatformSecret("LINKEDIN_CLIENT_ID")) as string,
      client_secret: (await getPlatformSecret("LINKEDIN_CLIENT_SECRET")) as string,
    }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
  };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    refreshToken: data.refresh_token ?? null,
    scope: data.scope ?? null,
  };
}

export interface LinkedInProfile {
  sub: string;
  name: string | null;
  email: string | null;
}

/** Fetch the OpenID Connect profile (`sub` is the member id used for posting). */
export async function fetchProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`LinkedIn userinfo failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { sub: string; name?: string; email?: string };
  return { sub: data.sub, name: data.name ?? null, email: data.email ?? null };
}

export interface LinkedInPostResult {
  id: string;
  url: string | null;
}

/** Publish a text post on behalf of the member (`urn:li:person:<sub>`). */
export async function createTextPost(
  accessToken: string,
  personSub: string,
  text: string
): Promise<LinkedInPostResult> {
  const author = `urn:li:person:${personSub}`;
  const res = await fetch(POSTS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`LinkedIn post failed (${res.status}): ${await res.text()}`);
  }
  // The created post URN is returned in the `x-restli-id` header.
  const id = res.headers.get("x-restli-id") ?? "";
  const url = id ? `https://www.linkedin.com/feed/update/${id}` : null;
  return { id, url };
}
