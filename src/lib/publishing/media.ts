import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublishingJobRow } from "@/lib/db/types";

/**
 * First public media URL of a given kind linked to the job's post, or null.
 * Used by video-first publishers (TikTok/YouTube) and image posts (Instagram).
 */
export async function linkedMediaUrl(
  client: SupabaseClient,
  job: PublishingJobRow,
  kind: "image" | "video"
): Promise<string | null> {
  if (!job.post_id) return null;
  const { data } = await client
    .from("media_assets")
    .select("url")
    .eq("workspace_id", job.workspace_id)
    .eq("linked_post_id", job.post_id)
    .eq("kind", kind)
    .not("url", "is", null)
    .limit(1)
    .maybeSingle();
  return (data as { url: string | null } | null)?.url ?? null;
}
