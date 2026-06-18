import "server-only";
import { createHmac } from "crypto";
import { getPlatformSecret } from "@/lib/platform/secrets";

/**
 * Best-effort outbound webhook to the admin-configured `PLATFORM_WEBHOOK_URL`.
 * No-op when no URL is set. Signs the body with HMAC-SHA256 when
 * `PLATFORM_WEBHOOK_SIGNING_SECRET` is configured (header `x-sf-signature`).
 */
export async function dispatchWebhook(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const url = await getPlatformSecret("PLATFORM_WEBHOOK_URL");
  if (!url) return;

  const body = JSON.stringify({ event, sentAt: new Date().toISOString(), data });
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-sf-event": event,
  };

  const signingSecret = await getPlatformSecret("PLATFORM_WEBHOOK_SIGNING_SECRET");
  if (signingSecret) {
    headers["x-sf-signature"] = createHmac("sha256", signingSecret).update(body).digest("hex");
  }

  try {
    await fetch(url, { method: "POST", headers, body });
  } catch {
    // best-effort — never throw into the caller
  }
}
