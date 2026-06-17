"use server";

import { revalidatePath } from "next/cache";
import {
  updateSettings as dbUpdateSettings,
  upsertConnectedAccount as dbUpsertConnectedAccount,
  setConnectionStatus as dbSetConnectionStatus,
  type UpdateSettingsInput,
  type ConnectedAccountInput,
} from "@/lib/db/settings";
import type { ConnectedAccountRow } from "@/lib/db/types";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

/** Revalidate routes whose data depends on settings / connected accounts. */
function revalidateSettings(): void {
  revalidatePath("/settings");
  revalidatePath("/integrations");
}

export async function updateSettings(
  input: UpdateSettingsInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const row = await dbUpdateSettings(input);
    revalidateSettings();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function upsertConnectedAccount(
  platform: string,
  input: ConnectedAccountInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const account = await dbUpsertConnectedAccount(platform, input);
    revalidateSettings();
    return { ok: true, id: account.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function setConnectionStatus(
  id: string,
  status: ConnectedAccountRow["status"]
): Promise<ActionResult<{ id: string }>> {
  try {
    const account = await dbSetConnectionStatus(id, status);
    revalidateSettings();
    return { ok: true, id: account.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
