"use server";

import { revalidatePath } from "next/cache";
import {
  createPost as dbCreatePost,
  updatePost as dbUpdatePost,
  updatePostStatus as dbUpdatePostStatus,
  duplicatePost as dbDuplicatePost,
  archivePost as dbArchivePost,
  deletePost as dbDeletePost,
  setPostChannels as dbSetPostChannels,
  type PostInput,
  type DbPostStatus,
} from "@/lib/db/posts";
import { schedulePost } from "@/lib/publishing/scheduler";
import type { ScheduleMode } from "@/lib/publishing/scheduler";
import type { Platform } from "@/lib/demo-data";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

/** Revalidate every route whose data depends on posts. */
function revalidatePosts(): void {
  revalidatePath("/posts");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function createPost(
  input: PostInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await dbCreatePost(input);
    revalidatePosts();
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await dbUpdatePost(id, input);
    revalidatePosts();
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updatePostStatus(
  id: string,
  status: DbPostStatus
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await dbUpdatePostStatus(id, status);
    revalidatePosts();
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function duplicatePost(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const newId = await dbDuplicatePost(id);
    revalidatePosts();
    return { ok: true, id: newId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function archivePost(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await dbArchivePost(id);
    revalidatePosts();
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deletePost(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deletedId = await dbDeletePost(id);
    revalidatePosts();
    return { ok: true, id: deletedId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function setPostChannels(
  postId: string,
  platforms: Platform[]
): Promise<ActionResult<{ id: string }>> {
  try {
    await dbSetPostChannels(postId, platforms);
    revalidatePosts();
    return { ok: true, id: postId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function schedulePostAction(
  postId: string,
  mode: ScheduleMode,
  scheduledAt?: string | null
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await schedulePost(postId, { mode, scheduledAt });
    revalidatePosts();
    return { ok: true, id: result.scheduledPost.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
