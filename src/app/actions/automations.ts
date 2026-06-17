"use server";

import { revalidatePath } from "next/cache";
import {
  createAutomation as dbCreateAutomation,
  updateAutomation as dbUpdateAutomation,
  toggleAutomationActive as dbToggleAutomationActive,
  toggleAutomationApproval as dbToggleAutomationApproval,
  deleteAutomation as dbDeleteAutomation,
  type CreateAutomationInput,
} from "@/lib/db/automations";

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** Extracts a user-safe message from an unknown thrown value (no stack traces). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function revalidateAutomations(): void {
  revalidatePath("/automations");
}

export async function createAutomation(
  input: CreateAutomationInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const automation = await dbCreateAutomation(input);
    revalidateAutomations();
    return { ok: true, id: automation.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateAutomation(
  id: string,
  input: Partial<CreateAutomationInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    const automation = await dbUpdateAutomation(id, input);
    revalidateAutomations();
    return { ok: true, id: automation.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function toggleAutomationActive(
  id: string,
  active: boolean
): Promise<ActionResult<{ id: string }>> {
  try {
    const automation = await dbToggleAutomationActive(id, active);
    revalidateAutomations();
    return { ok: true, id: automation.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function toggleAutomationApproval(
  id: string,
  requiresApproval: boolean
): Promise<ActionResult<{ id: string }>> {
  try {
    const automation = await dbToggleAutomationApproval(id, requiresApproval);
    revalidateAutomations();
    return { ok: true, id: automation.id };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function deleteAutomation(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const deletedId = await dbDeleteAutomation(id);
    revalidateAutomations();
    return { ok: true, id: deletedId };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
