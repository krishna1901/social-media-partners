import "server-only";
import { isProviderConfigured } from "@/lib/integrations/scaffold";

/**
 * Phase 6 — YouTube publishing via the Data API v3 resumable upload. The source
 * video (a linked media asset) is fetched, then streamed to YouTube in a
 * resumable session. Requires the `youtube.upload` scope (granted at connect).
 */

const RESUMABLE_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 5000;

export function isYouTubeConfigured(): boolean {
  return isProviderConfigured("youtube");
}

export interface YouTubePostResult {
  id: string;
  url: string | null;
}

/** Upload a video (fetched from `videoUrl`) and publish it. */
export async function uploadVideoFromUrl(
  accessToken: string,
  videoUrl: string,
  title: string,
  description: string
): Promise<YouTubePostResult> {
  // 1. Fetch the source video bytes.
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`Could not fetch video asset (${videoRes.status}).`);
  }
  const contentType = videoRes.headers.get("content-type") ?? "video/*";
  const bytes = Buffer.from(await videoRes.arrayBuffer());

  // 2. Open a resumable upload session (metadata first).
  const initRes = await fetch(RESUMABLE_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-type": contentType,
      "x-upload-content-length": String(bytes.length),
    },
    body: JSON.stringify({
      snippet: { title: title.slice(0, TITLE_LIMIT), description: description.slice(0, DESCRIPTION_LIMIT) },
      status: { privacyStatus: "public" },
    }),
  });
  if (!initRes.ok) {
    throw new Error(`YouTube upload init failed (${initRes.status}): ${await initRes.text()}`);
  }
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube did not return a resumable upload URL.");

  // 3. Upload the bytes.
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType, "content-length": String(bytes.length) },
    body: bytes,
  });
  if (!putRes.ok) {
    throw new Error(`YouTube upload failed (${putRes.status}): ${await putRes.text()}`);
  }
  const data = (await putRes.json()) as { id?: string };
  const id = data.id ?? "";
  return { id, url: id ? `https://youtu.be/${id}` : null };
}
