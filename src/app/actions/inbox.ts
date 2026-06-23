"use server";

import { revalidatePath } from "next/cache";
import {
  updateInboxStatus as dbUpdateInboxStatus,
  updateInboxSentiment as dbUpdateInboxSentiment,
  saveReplyDraft as dbSaveReplyDraft,
  markReplied as dbMarkReplied,
  markIgnored as dbMarkIgnored,
  sendReply as dbSendReply,
} from "@/lib/db/inbox";
import { syncCurrentWorkspaceInbox } from "@/lib/inbox/sync";
import type { InboxRow } from "@/lib/db/types";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function revalidateInbox(): void {
  revalidatePath("/inbox");
}

/** Sync comments from connected platforms into the inbox. */
export async function syncInboxAction(): Promise<
  ActionResult<{ synced: number; platforms: string[]; message?: string }>
> {
  try {
    const summary = await syncCurrentWorkspaceInbox();
    revalidateInbox();
    return { ok: true, synced: summary.synced, platforms: summary.platforms, message: summary.message };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateInboxStatus(
  id: string,
  status: InboxRow["status"]
): Promise<ActionResult<{ id: string }>> {
  try {
    const row = await dbUpdateInboxStatus(id, status);
    revalidateInbox();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateInboxSentiment(
  id: string,
  sentiment: InboxRow["sentiment"]
): Promise<ActionResult<{ id: string }>> {
  try {
    const row = await dbUpdateInboxSentiment(id, sentiment);
    revalidateInbox();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function saveReplyDraft(
  id: string,
  draft: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const row = await dbSaveReplyDraft(id, draft);
    revalidateInbox();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function markReplied(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const row = await dbMarkReplied(id);
    revalidateInbox();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Post a reply to the platform (simulate-safe) and mark the item replied. */
export async function sendReply(
  id: string,
  text: string
): Promise<ActionResult<{ id: string; status: string; message: string }>> {
  try {
    if (!text.trim()) return { ok: false, error: "Reply can't be empty." };
    const { row, status, message } = await dbSendReply(id, text.trim());
    revalidateInbox();
    return { ok: true, id: row.id, status, message };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function markIgnored(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const row = await dbMarkIgnored(id);
    revalidateInbox();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
