"use server";

import { revalidatePath } from "next/cache";
import {
  createCompetitor as dbCreateCompetitor,
  updateCompetitor as dbUpdateCompetitor,
  archiveCompetitor as dbArchiveCompetitor,
  deleteCompetitor as dbDeleteCompetitor,
  addCompetitorPost as dbAddCompetitorPost,
  type CreateCompetitorInput,
  type CompetitorPostInput,
} from "@/lib/db/competitors";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function revalidateCompetitors(): void {
  revalidatePath("/competitors");
}

export async function createCompetitor(
  input: CreateCompetitorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const competitor = await dbCreateCompetitor(input);
    revalidateCompetitors();
    return { ok: true, id: competitor.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateCompetitor(
  id: string,
  input: Partial<CreateCompetitorInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    const competitor = await dbUpdateCompetitor(id, input);
    revalidateCompetitors();
    return { ok: true, id: competitor.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function archiveCompetitor(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const competitor = await dbArchiveCompetitor(id);
    revalidateCompetitors();
    return { ok: true, id: competitor.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteCompetitor(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deletedId = await dbDeleteCompetitor(id);
    revalidateCompetitors();
    return { ok: true, id: deletedId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function addCompetitorPost(
  competitorId: string,
  input: CompetitorPostInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const post = await dbAddCompetitorPost(competitorId, input);
    revalidateCompetitors();
    return { ok: true, id: post.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
