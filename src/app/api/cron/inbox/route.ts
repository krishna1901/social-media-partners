import { NextResponse, type NextRequest } from "next/server";
import { syncAllWorkspacesInbox } from "@/lib/inbox/sync";
import { runAllWorkspacesAutomations } from "@/lib/automations/runner";
import { runAllWorkspacesEngine } from "@/lib/automations/engine";
import { isCronAuthorized } from "@/lib/cron/auth";

/**
 * Inbox/comment sync + automation engine endpoint (Phase 3F / Phase 6).
 * Triggered by an external scheduler — NOT registered in vercel.json to stay
 * within the Hobby 2-cron limit. First syncs new comments, then runs each
 * workspace's active automations against them. Gated by `CRON_SECRET`; safe demo
 * no-op without a service role.
 */
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Sync first so automations can act on freshly-pulled comments.
    const sync = await syncAllWorkspacesInbox();
    const automations = await runAllWorkspacesAutomations();
    const engine = await runAllWorkspacesEngine();
    return NextResponse.json({
      ok: sync.ok && automations.ok && engine.ok,
      sync,
      automations,
      engine,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
