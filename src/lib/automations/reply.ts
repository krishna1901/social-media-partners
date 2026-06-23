import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InboxRow } from "@/lib/db/types";
import { getDecryptedToken } from "@/lib/db/social-tokens";
import { isMetaConfigured, replyToComment } from "@/lib/integrations/meta";

/**
 * Platform reply dispatcher for auto-comment / auto-reply automations and the
 * inbox "send reply" action. Mirrors the publishing runner: it attempts a real
 * platform call and falls back to a *simulated* send when the integration isn't
 * wired/configured — gated by `PUBLISH_SIMULATE` (default ON) so the full
 * comment → reply lifecycle is observable without live third-party credentials.
 *
 * Only Facebook/Instagram comment replies are wired for real sends today (via
 * the Meta Graph API). Everything else resolves to `not_implemented`, which
 * simulate mode records as a success.
 */

export type ReplyStatus = "sent" | "simulated" | "not_implemented" | "failed";

export interface ReplyResult {
  ok: boolean;
  status: ReplyStatus;
  externalId?: string;
  message: string;
}

function simulateEnabled(): boolean {
  return process.env.PUBLISH_SIMULATE !== "false";
}

/** Attempt a real platform reply; `not_implemented` when not wired/available. */
async function dispatchReal(
  client: SupabaseClient,
  item: InboxRow,
  text: string
): Promise<ReplyResult> {
  if (item.type !== "comment") {
    return { ok: false, status: "not_implemented", message: `Replies to ${item.type}s aren't supported yet` };
  }

  if (item.platform === "facebook" || item.platform === "instagram") {
    if (!item.external_id) {
      return { ok: false, status: "not_implemented", message: "No platform comment id on this item" };
    }
    if (!(await isMetaConfigured())) {
      return { ok: false, status: "not_implemented", message: "Meta app not configured" };
    }
    const token = await getDecryptedToken(client, item.workspace_id, item.platform);
    if (!token) {
      return { ok: false, status: "not_implemented", message: `${item.platform} account not connected` };
    }
    try {
      const r = await replyToComment(item.external_id, token.accessToken, text, item.platform);
      return { ok: true, status: "sent", externalId: r.id, message: `Replied on ${item.platform}` };
    } catch (err) {
      return { ok: false, status: "failed", message: err instanceof Error ? err.message : "Reply failed" };
    }
  }

  return { ok: false, status: "not_implemented", message: `Replies on ${item.platform} aren't supported yet` };
}

/**
 * Send a reply to an inbox item. In simulate mode (default), a `not_implemented`
 * result becomes a successful *simulated* send; with `PUBLISH_SIMULATE=false`,
 * `not_implemented` and errors are returned as honest failures so the caller can
 * leave the item for human review.
 */
export async function sendPlatformReply(
  client: SupabaseClient,
  item: InboxRow,
  text: string
): Promise<ReplyResult> {
  const result = await dispatchReal(client, item, text);
  if (result.status === "sent" || result.status === "failed") return result;

  // not_implemented
  if (simulateEnabled()) {
    return {
      ok: true,
      status: "simulated",
      message: `Simulated reply on ${item.platform} (no live integration configured)`,
    };
  }
  return result;
}
