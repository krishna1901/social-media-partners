"use server";

import { revalidatePath } from "next/cache";
import {
  createTrend as dbCreateTrend,
  updateTrend as dbUpdateTrend,
  saveTrendAsIdea as dbSaveTrendAsIdea,
  archiveTrend as dbArchiveTrend,
  type CreateTrendInput,
  type UpdateTrendInput,
} from "@/lib/db/trends";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

/** Revalidate routes whose data depends on trends (and ideas, on save). */
function revalidateTrends(): void {
  revalidatePath("/trends");
  revalidatePath("/ideas");
}

export async function createTrend(
  input: CreateTrendInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const trend = await dbCreateTrend(input);
    revalidateTrends();
    return { ok: true, id: trend.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateTrend(
  id: string,
  input: UpdateTrendInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const trend = await dbUpdateTrend(id, input);
    revalidateTrends();
    return { ok: true, id: trend.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function saveTrendAsIdea(
  trendId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const ideaId = await dbSaveTrendAsIdea(trendId);
    revalidateTrends();
    return { ok: true, id: ideaId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function archiveTrend(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const trend = await dbArchiveTrend(id);
    revalidateTrends();
    return { ok: true, id: trend.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
