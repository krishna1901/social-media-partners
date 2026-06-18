import { NextResponse, type NextRequest } from "next/server";
import { syncAllWorkspaces as syncAllWorkspacesAnalytics } from "@/lib/analytics/sync";
import { syncAllWorkspacesInbox } from "@/lib/inbox/sync";
import { runAllWorkspacesAutomations } from "@/lib/automations/runner";
import { runAllWorkspacesEngine } from "@/lib/automations/engine";
import { getPlatformSecret } from "@/lib/platform/secrets";

/**
 * Consolidated maintenance cron (Phase 7).
 *
 * Runs the non-time-critical background jobs in one pass so the app stays within
 * the Vercel Hobby 2-cron limit (this + `/api/cron/publish`): analytics sync →
 * inbox/comment sync → automation engine. Gated by `CRON_SECRET`; a safe demo
 * no-op without a service role. The per-job endpoints (`/api/cron/analytics`,
 * `/api/cron/inbox`) remain for external/back-compat callers.
 */
export const dynamic = "force-dynamic";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = await getPlatformSecret("CRON_SECRET");
  if (!secret) return true;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  if (request.headers.get("x-cron-secret") === secret) return true;
  if (request.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

async function handle(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const analytics = await syncAllWorkspacesAnalytics();
    const inbox = await syncAllWorkspacesInbox();
    const automations = await runAllWorkspacesAutomations();
    const engine = await runAllWorkspacesEngine();
    return NextResponse.json({ ok: true, analytics, inbox, automations, engine });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Maintenance run failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
