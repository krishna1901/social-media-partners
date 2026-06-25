import "server-only";
import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { getPlatformSecret } from "@/lib/platform/secrets";
import { isAdminConfigured } from "@/lib/supabase/admin";

/** Constant-time string compare (length-guarded; secret length is not sensitive). */
function safeEqual(a: string | null, b: string): boolean {
  if (a === null) return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false; // timingSafeEqual throws on length mismatch
  return timingSafeEqual(ab, bb);
}

/**
 * Authorize a cron request. Accepts the secret as `Authorization: Bearer …`,
 * `x-cron-secret: …`, or `?secret=…` (the query form can land in access logs —
 * prefer a header).
 *
 * Fail-closed: when no `CRON_SECRET` is configured we allow the request ONLY in
 * true demo mode (no service role), where the runners are genuine no-ops. If a
 * service role IS configured but the secret was never set, we deny — otherwise
 * the endpoints (which publish/sync/automate across every workspace with the
 * service-role client) would be open to anonymous callers.
 */
export async function isCronAuthorized(request: NextRequest): Promise<boolean> {
  const secret = await getPlatformSecret("CRON_SECRET");
  if (!secret) return !isAdminConfigured();

  if (safeEqual(request.headers.get("authorization"), `Bearer ${secret}`)) return true;
  if (safeEqual(request.headers.get("x-cron-secret"), secret)) return true;
  if (safeEqual(request.nextUrl.searchParams.get("secret"), secret)) return true;
  return false;
}
