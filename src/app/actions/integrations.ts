"use server";

import { revalidatePath } from "next/cache";
import { requireLiveContext } from "@/lib/db/context";
import { removeConnection } from "@/lib/db/social-tokens";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** Disconnect a social platform: removes its connected account + stored token. */
export async function disconnectPlatformAction(platform: string): Promise<ActionResult> {
  try {
    const ctx = await requireLiveContext();
    await removeConnection(ctx.supabase, ctx.workspaceId, platform);
    revalidatePath("/integrations");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to disconnect." };
  }
}
