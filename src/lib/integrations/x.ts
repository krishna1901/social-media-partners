import "server-only";
import { isProviderConfigured } from "@/lib/integrations/scaffold";

/**
 * Phase 6 — X (Twitter) publishing via the v2 API. OAuth + token storage live in
 * the scaffold registry; this module makes the real POST /2/tweets call.
 */

const TWEETS_URL = "https://api.x.com/2/tweets";

export function isXConfigured(): boolean {
  return isProviderConfigured("x");
}

export interface XPostResult {
  id: string;
  url: string | null;
}

/** Post a text tweet on behalf of the connected user (Bearer = user token). */
export async function createTweet(accessToken: string, text: string): Promise<XPostResult> {
  const res = await fetch(TWEETS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`X post failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { data?: { id?: string } };
  const id = data.data?.id ?? "";
  return { id, url: id ? `https://x.com/i/web/status/${id}` : null };
}
