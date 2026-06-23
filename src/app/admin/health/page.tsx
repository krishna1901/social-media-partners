import type { Metadata } from "next";
import { Activity, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
import { getDbContext } from "@/lib/db/context";
import { getHealthReport } from "@/lib/admin/health";
import { ChartCard } from "@/components/ui/chart-card";
import { HealthItemRow, ChecklistRow } from "@/components/admin/health-status";
import { HealthTests } from "@/components/admin/health-tests";

export const metadata: Metadata = { title: "Health" };

// Live, request-scoped checks — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  // The admin layout already enforces super-admin; reuse the request context for
  // the authenticated client used by the live DB reachability check.
  const ctx = await getDbContext();
  const report = await getHealthReport({ supabase: ctx.supabase, isSuperAdmin: true });

  const summary = [
    { label: "Healthy", value: report.summary.healthy, icon: CheckCircle2, tone: "text-emerald-600", ring: "ring-emerald-100 bg-emerald-50" },
    { label: "Attention", value: report.summary.attention, icon: AlertTriangle, tone: "text-amber-600", ring: "ring-amber-100 bg-amber-50" },
    { label: "Errors", value: report.summary.errors, icon: XCircle, tone: "text-red-600", ring: "ring-red-100 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Activity className="h-6 w-6 text-brand-500" /> Production health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only status for deployment & launch. Presence and reachability only — no secret values are ever shown.
          </p>
        </div>
        <div className="flex gap-2">
          {summary.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-inset ${s.ring}`}>
                <Icon className={`h-4 w-4 ${s.tone}`} />
                <div className="leading-tight">
                  <p className={`text-lg font-bold tabular-nums ${s.tone}`}>{s.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {report.sections.map((section) => (
          <ChartCard key={section.title} title={section.title} subtitle={section.description} bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {section.items.map((item) => (
                <HealthItemRow key={item.id} item={item} />
              ))}
            </ul>
          </ChartCard>
        ))}
      </div>

      {/* Safe connection tests */}
      <ChartCard
        title="Safe connection tests"
        subtitle="Run on demand to verify each integration actually responds."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" /> admin-only
          </span>
        }
      >
        <HealthTests />
      </ChartCard>

      {/* Setup checklist */}
      <ChartCard
        title="Launch setup checklist"
        subtitle="Auto-derived where possible. Items marked “Verify” are checked in external dashboards."
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-border">
          {report.checklist.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
