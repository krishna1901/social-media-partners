import "server-only";
import { isProviderConfigured } from "@/lib/integrations/scaffold";

/**
 * Phase 6 — TikTok publishing via the Content Posting API. Uses PULL_FROM_URL so
 * TikTok fetches the video from a public URL (the linked media asset). Live
 * posting requires the app to pass TikTok's content-posting audit and to have
 * the source URL's domain verified.
 */

const INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const TITLE_LIMIT = 2200;

export function isTikTokConfigured(): boolean {
  return isProviderConfigured("tiktok");
}

export interface TikTokPostResult {
  id: string;
}

/** Initiate a direct video post sourced from a public URL. */
export async function publishVideoFromUrl(
  accessToken: string,
  videoUrl: string,
  title: string
): Promise<TikTokPostResult> {
  const res = await fetch(INIT_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: title.slice(0, TITLE_LIMIT),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
      },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  if (!res.ok) {
    throw new Error(`TikTok publish failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as {
    data?: { publish_id?: string };
    error?: { code?: string; message?: string };
  };
  if (data.error && data.error.code && data.error.code !== "ok") {
    throw new Error(`TikTok publish error: ${data.error.message ?? data.error.code}`);
  }
  return { id: data.data?.publish_id ?? "" };
}
