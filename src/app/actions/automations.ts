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
import { runCurrentWorkspaceAutomations } from "@/lib/automations/runner";
import { runCurrentWorkspaceEngine, dryRunRule } from "@/lib/automations/engine";

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

/**
 * Run all active automations for the current workspace now: the legacy inbox
 * auto-reply runner AND the general engine. Safe in demo mode (no-op). Returns a
 * single human-readable summary for the UI.
 */
export async function runAutomationsAction(): Promise<ActionResult<{ message: string }>> {
  try {
    const inbox = await runCurrentWorkspaceAutomations();
    const engine = await runCurrentWorkspaceEngine();
    revalidatePath("/automations");
    revalidatePath("/inbox");

    if (engine.mode === "demo" && inbox.mode === "demo") {
      return { ok: true, message: engine.message ?? "Demo mode — nothing to run." };
    }

    const parts: string[] = [];
    if (inbox.matched > 0) {
      parts.push(
        `${inbox.matched} inbox item${inbox.matched === 1 ? "" : "s"} processed (${inbox.autoHandled} handled, ${inbox.drafted} drafted)`
      );
    }
    if (engine.rulesEvaluated > 0) {
      parts.push(`${engine.rulesEvaluated} rule${engine.rulesEvaluated === 1 ? "" : "s"} evaluated`);
    }
    if (engine.actionsTaken > 0) parts.push(`${engine.actionsTaken} action(s) taken`);
    if (engine.pending > 0) parts.push(`${engine.pending} awaiting approval`);
    if (engine.failed > 0) parts.push(`${engine.failed} failed`);

    const message = parts.length
      ? parts.join(" · ")
      : "No new items matched your active automations.";
    return { ok: true, message };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Dry-run (test) a single rule without performing its action. */
export async function dryRunRuleAction(
  id: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const summary = await dryRunRule(id);
    revalidatePath("/automations");
    const outcome = summary.outcomes[0];
    return {
      ok: true,
      message: outcome?.actionTaken ?? summary.message ?? "Dry run complete — no matches.",
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
