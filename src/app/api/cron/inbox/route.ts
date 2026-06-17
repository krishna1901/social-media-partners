import { NextResponse, type NextRequest } from "next/server";
import { syncAllWorkspacesInbox } from "@/lib/inbox/sync";

/**
 * Inbox/comment sync endpoint (Phase 3F). Triggered by an external scheduler (or
 * folded into another job) — NOT registered in vercel.json to stay within the
 * Hobby 2-cron limit. Gated by `CRON_SECRET`; safe demo no-op without a service
 * role.
 */
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  if (request.headers.get("x-cron-secret") === secret) return true;
  if (request.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await syncAllWorkspacesInbox();
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
