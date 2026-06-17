"use server";

import { revalidatePath } from "next/cache";
import {
  createMediaAsset as dbCreateMediaAsset,
  updateMediaAsset as dbUpdateMediaAsset,
  linkMediaToPost as dbLinkMediaToPost,
  archiveMedia as dbArchiveMedia,
  deleteMedia as dbDeleteMedia,
  type MediaInput,
  type MediaUpdateInput,
} from "@/lib/db/media";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function revalidateMedia(): void {
  revalidatePath("/media");
}

export async function createMediaAsset(
  input: MediaInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const asset = await dbCreateMediaAsset(input);
    revalidateMedia();
    return { ok: true, id: asset.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateMediaAsset(
  id: string,
  input: MediaUpdateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const asset = await dbUpdateMediaAsset(id, input);
    revalidateMedia();
    return { ok: true, id: asset.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function linkMediaToPost(
  mediaId: string,
  postId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const asset = await dbLinkMediaToPost(mediaId, postId);
    revalidateMedia();
    return { ok: true, id: asset.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function archiveMedia(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const asset = await dbArchiveMedia(id);
    revalidateMedia();
    return { ok: true, id: asset.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteMedia(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deletedId = await dbDeleteMedia(id);
    revalidateMedia();
    return { ok: true, id: deletedId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
