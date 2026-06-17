"use server";

import { revalidatePath } from "next/cache";
import { syncCurrentWorkspace } from "@/lib/analytics/sync";

type SyncResult =
  | { ok: true; synced: number; platforms: string[]; message?: string }
  | { ok: false; error: string };

/** Manually sync analytics for the active workspace's connected platforms. */
export async function syncAnalyticsAction(): Promise<SyncResult> {
  try {
    const summary = await syncCurrentWorkspace();
    revalidatePath("/analytics");
    return { ok: true, synced: summary.synced, platforms: summary.platforms, message: summary.message };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Sync failed." };
  }
}
