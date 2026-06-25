import { NextResponse, type NextRequest } from "next/server";
import { syncAllWorkspaces } from "@/lib/analytics/sync";
import { isCronAuthorized } from "@/lib/cron/auth";

/**
 * Analytics sync endpoint (Phase 3E). Triggered on a schedule (Vercel Cron or an
 * external scheduler) to pull metrics for all connected workspaces. Gated by
 * `CRON_SECRET` when set; safe demo no-op without a service role.
 */
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await syncAllWorkspaces();
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
