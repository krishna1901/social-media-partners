import "server-only";
import type { Platform } from "@/lib/demo-data";
import type { PostRow } from "@/lib/db/types";

/**
 * Phase 2 — platform formatter.
 *
 * Pure, typed, I/O-free helpers that shape a post for a given platform. The
 * scheduler/runner (Phase 3) will hand the result to each platform's `publish`
 * function. No network calls, no DB access — everything here is deterministic.
 */

/** Media constraints for a platform (placeholder values; tuned in Phase 3). */
export interface MediaRequirements {
  /** Max number of images allowed in a single post (carousel limit). */
  maxImages: number;
  /** Whether the platform accepts native video. */
  video: boolean;
  /** Accepted aspect ratios, as "w:h" strings. */
  aspectRatios: string[];
}

/** The shape returned by `formatForPlatform`. */
export interface FormattedPost {
  platform: Platform;
  caption: string;
  hashtags: string[];
  mediaRequirements: MediaRequirements;
}

/** Splits a stored hashtag string ("#a #b, c") into a clean string[]. */
function parseHashtags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

/* ------------------------- per-platform caption pickers ------------------------- */

/** Instagram prefers its dedicated caption, else the universal one. */
export function instagramCaption(post: PostRow): string {
  return post.instagram_caption || post.universal_caption || "";
}

/** LinkedIn prefers its dedicated caption, else the universal one. */
export function linkedinCaption(post: PostRow): string {
  return post.linkedin_caption || post.universal_caption || "";
}

/** Everything else falls back to the universal caption. */
export function universalCaption(post: PostRow): string {
  return post.universal_caption || "";
}

/** Picks the best caption for a platform. */
export function captionForPlatform(platform: Platform, post: PostRow): string {
  switch (platform) {
    case "instagram":
      return instagramCaption(post);
    case "linkedin":
      return linkedinCaption(post);
    default:
      return universalCaption(post);
  }
}

/* ------------------------------ media requirements ------------------------------ */

/**
 * Placeholder media requirements per platform. Numbers are reasonable defaults
 * and MUST be verified against each official API before Phase 3 publishing.
 */
export function mediaRequirements(platform: Platform): MediaRequirements {
  switch (platform) {
    case "instagram":
      return { maxImages: 10, video: true, aspectRatios: ["1:1", "4:5", "9:16"] };
    case "facebook":
      return { maxImages: 10, video: true, aspectRatios: ["1:1", "4:5", "16:9"] };
    case "linkedin":
      return { maxImages: 9, video: true, aspectRatios: ["1:1", "1.91:1"] };
    case "youtube":
      return { maxImages: 1, video: true, aspectRatios: ["16:9", "9:16"] };
    case "tiktok":
      return { maxImages: 35, video: true, aspectRatios: ["9:16"] };
    case "x":
      return { maxImages: 4, video: true, aspectRatios: ["16:9", "1:1"] };
    default:
      return { maxImages: 1, video: false, aspectRatios: ["1:1"] };
  }
}

/**
 * Formats a post for a single platform. Pure function — given the same inputs it
 * always returns the same output.
 */
export function formatForPlatform(platform: Platform, post: PostRow): FormattedPost {
  return {
    platform,
    caption: captionForPlatform(platform, post),
    hashtags: parseHashtags(post.hashtags),
    mediaRequirements: mediaRequirements(platform),
  };
}
