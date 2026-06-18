import "server-only";
import { getPlatformSecret } from "@/lib/platform/secrets";

/**
 * Meta (Facebook + Instagram) integration client — dependency-free `fetch`.
 *
 * Facebook Login OAuth → a long-lived user token → the user's Pages (each with a
 * Page access token and, optionally, a linked Instagram Business account).
 * Publishing uses the Page token: Facebook via `/{page}/feed`, Instagram via the
 * media container + publish flow. All keys are server-only; when not configured
 * callers short-circuit so demo/preview makes no network calls.
 *
 * Docs: Facebook Login (https://developers.facebook.com/docs/facebook-login),
 * Pages API + Instagram Content Publishing
 * (https://developers.facebook.com/docs/instagram-api/guides/content-publishing).
 */

const GRAPH = "https://graph.facebook.com/v21.0";
const DIALOG = "https://www.facebook.com/v21.0/dialog/oauth";

export const META_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
];

export async function isMetaConfigured(): Promise<boolean> {
  const [id, secret] = await Promise.all([
    getPlatformSecret("META_APP_ID"),
    getPlatformSecret("META_APP_SECRET"),
  ]);
  return Boolean(id && secret);
}

/**
 * Redirect URI for the OAuth callback. Honors an explicit `META_REDIRECT_URI`
 * override (must match the value registered in the Meta app); otherwise it's
 * derived from the app URL.
 */
export function metaRedirectUri(): string {
  const override = process.env.META_REDIRECT_URI?.trim();
  if (override) return override;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/oauth/meta/callback`;
}

export async function buildAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: (await getPlatformSecret("META_APP_ID")) as string,
    redirect_uri: metaRedirectUri(),
    state,
    scope: META_SCOPES.join(","),
    response_type: "code",
  });
  return `${DIALOG}?${params.toString()}`;
}

/** Exchange a code for a (short-lived) user access token. */
export async function exchangeCode(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    client_id: (await getPlatformSecret("META_APP_ID")) as string,
    client_secret: (await getPlatformSecret("META_APP_SECRET")) as string,
    redirect_uri: metaRedirectUri(),
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Meta token exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 0 };
}

/** Upgrade a short-lived user token to a long-lived one (~60 days). */
export async function exchangeForLongLived(userToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: (await getPlatformSecret("META_APP_ID")) as string,
    client_secret: (await getPlatformSecret("META_APP_SECRET")) as string,
    fb_exchange_token: userToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error(`Meta long-lived exchange failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 0 };
}

export interface MetaPage {
  id: string;
  name: string;
  accessToken: string;
  instagramId: string | null;
  instagramUsername: string | null;
}

/** List the Pages the user manages (with Page tokens + linked IG accounts). */
export async function listManagedPages(userToken: string): Promise<MetaPage[]> {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account{id,username}",
    access_token: userToken,
  });
  const res = await fetch(`${GRAPH}/me/accounts?${params.toString()}`);
  if (!res.ok) throw new Error(`Meta pages fetch failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as {
    data?: {
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username?: string };
    }[];
  };
  return (data.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    accessToken: p.access_token,
    instagramId: p.instagram_business_account?.id ?? null,
    instagramUsername: p.instagram_business_account?.username ?? null,
  }));
}

/**
 * The permissions the user actually granted during consent. Authoritative source
 * for "is publishing allowed?" — a user can decline individual scopes. Returns
 * only the granted permission names.
 */
export async function listGrantedPermissions(userToken: string): Promise<string[]> {
  const params = new URLSearchParams({ access_token: userToken });
  const res = await fetch(`${GRAPH}/me/permissions?${params.toString()}`);
  if (!res.ok) throw new Error(`Meta permissions fetch failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as {
    data?: { permission: string; status: string }[];
  };
  return (data.data ?? [])
    .filter((p) => p.status === "granted")
    .map((p) => p.permission);
}

export interface MetaPublishResult {
  id: string;
  url: string | null;
}

/** Publish a text post to a Facebook Page feed. */
export async function publishToFacebookPage(
  pageId: string,
  pageToken: string,
  message: string
): Promise<MetaPublishResult> {
  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, access_token: pageToken }),
  });
  if (!res.ok) throw new Error(`Facebook publish failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id, url: `https://www.facebook.com/${data.id}` };
}

/**
 * Publish an image post to Instagram (container → publish). Requires a publicly
 * reachable `imageUrl` (Instagram fetches it server-side).
 */
export async function publishToInstagram(
  igId: string,
  pageToken: string,
  imageUrl: string,
  caption: string
): Promise<MetaPublishResult> {
  // 1. Create the media container.
  const createRes = await fetch(`${GRAPH}/${igId}/media`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
  });
  if (!createRes.ok) {
    throw new Error(`Instagram container failed (${createRes.status}): ${await createRes.text()}`);
  }
  const container = (await createRes.json()) as { id: string };

  // 2. Publish the container.
  const pubRes = await fetch(`${GRAPH}/${igId}/media_publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
  });
  if (!pubRes.ok) {
    throw new Error(`Instagram publish failed (${pubRes.status}): ${await pubRes.text()}`);
  }
  const data = (await pubRes.json()) as { id: string };
  return { id: data.id, url: null };
}
