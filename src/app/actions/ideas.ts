"use server";

import { revalidatePath } from "next/cache";
import {
  createIdea as dbCreateIdea,
  updateIdea as dbUpdateIdea,
  archiveIdea as dbArchiveIdea,
  deleteIdea as dbDeleteIdea,
  convertIdeaToPost as dbConvertIdeaToPost,
  type IdeaInput,
} from "@/lib/db/ideas";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

/** Revalidate routes whose data depends on ideas (and posts, on conversion). */
function revalidateIdeas(): void {
  revalidatePath("/ideas");
  revalidatePath("/posts");
}

export async function createIdea(
  input: IdeaInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const idea = await dbCreateIdea(input);
    revalidateIdeas();
    return { ok: true, id: idea.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateIdea(
  id: string,
  input: IdeaInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const idea = await dbUpdateIdea(id, input);
    revalidateIdeas();
    return { ok: true, id: idea.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function archiveIdea(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const idea = await dbArchiveIdea(id);
    revalidateIdeas();
    return { ok: true, id: idea.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteIdea(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deletedId = await dbDeleteIdea(id);
    revalidateIdeas();
    return { ok: true, id: deletedId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function convertIdeaToPost(
  ideaId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const postId = await dbConvertIdeaToPost(ideaId);
    revalidateIdeas();
    return { ok: true, id: postId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
