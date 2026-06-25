import { NextResponse, type NextRequest } from "next/server";
import { runAllDueJobs } from "@/lib/publishing/runner";
import { isCronAuthorized } from "@/lib/cron/auth";

/**
 * Publishing job runner endpoint (Phase 3B).
 *
 * Designed to be triggered on a schedule (Vercel Cron, an external scheduler, or
 * a Supabase pg_cron HTTP call). It drains all workspaces' due `publishing_jobs`
 * via the service-role runner.
 *
 * Auth: when `CRON_SECRET` is set, the request must present it as
 * `Authorization: Bearer <secret>`, `x-cron-secret: <secret>`, or `?secret=`.
 * Vercel Cron automatically sends the bearer token when `CRON_SECRET` is set.
 * With no secret AND no service role configured, it's a harmless demo no-op.
 */
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runAllDueJobs();
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Runner failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
