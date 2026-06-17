/**
 * Client-safe media upload helper for the Media Library.
 *
 * NOTE: deliberately NO `import "server-only"` — this module is imported by
 * client components and runs in the browser using the browser Supabase client.
 *
 * It validates the file (MIME + size), uploads to the Storage bucket that
 * matches the media kind, and returns the stored object's location + public URL.
 * In demo/preview mode (no real Supabase env) it throws a clear error so the UI
 * can show "Storage not configured (demo mode)".
 */
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Media kinds, mirroring the `media_assets.kind` enum + Storage buckets. */
export type MediaKind = "image" | "video" | "thumbnail" | "carousel" | "zip";

/** Error thrown on a validation failure (bad MIME type or oversized file). */
export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

/** Allowed MIME types per media kind. */
export const ALLOWED_TYPES: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  thumbnail: ["image/jpeg", "image/png", "image/webp"],
  carousel: ["image/jpeg", "image/png", "image/webp"],
  zip: ["application/zip", "application/x-zip-compressed"],
};

/** Max upload size (bytes) per media kind. */
export const MAX_SIZES: Record<MediaKind, number> = {
  image: 15 * 1024 * 1024, // 15 MB
  video: 500 * 1024 * 1024, // 500 MB
  thumbnail: 5 * 1024 * 1024, // 5 MB
  carousel: 15 * 1024 * 1024, // 15 MB
  zip: 100 * 1024 * 1024, // 100 MB
};

/** Maps a media kind to its Storage bucket id (see supabase/schema.sql). */
export function bucketForKind(kind: MediaKind): string {
  switch (kind) {
    case "image":
      return "media";
    case "video":
      return "videos";
    case "thumbnail":
      return "thumbnails";
    case "carousel":
      return "carousels";
    case "zip":
      return "zips";
    default:
      return "media";
  }
}

/** Result of a successful upload. */
export interface UploadResult {
  bucket: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface UploadMediaOptions {
  kind: MediaKind;
}

/** Strips a filename down to a storage-safe slug, preserving the extension. */
function sanitizeName(name: string): string {
  const safe = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "file";
}

/**
 * Uploads a file to the correct Supabase Storage bucket and returns its
 * location + public URL.
 *
 * @throws Error when storage is not configured (demo mode).
 * @throws StorageValidationError when the MIME type or size is not allowed.
 */
export async function uploadMedia(
  file: File,
  opts: UploadMediaOptions
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Storage not configured (demo mode)");
  }

  const { kind } = opts;
  const allowed = ALLOWED_TYPES[kind];
  const maxSize = MAX_SIZES[kind];

  // Validate MIME type.
  if (!allowed.includes(file.type)) {
    throw new StorageValidationError(
      `Unsupported file type "${file.type || "unknown"}" for ${kind}. ` +
        `Allowed: ${allowed.join(", ")}.`
    );
  }

  // Validate size.
  if (file.size > maxSize) {
    const mb = (maxSize / (1024 * 1024)).toFixed(0);
    throw new StorageValidationError(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). ` +
        `Max for ${kind} is ${mb} MB.`
    );
  }

  const supabase = createClient();
  const bucket = bucketForKind(kind);

  // Scope uploads under the workspace/user folder when known, else "uploads".
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const folder = user?.id ?? "uploads";

  const safeName = sanitizeName(file.name);
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    url: publicUrl,
    size: file.size,
    mimeType: file.type,
  };
}
