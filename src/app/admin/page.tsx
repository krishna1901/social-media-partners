import type { Metadata } from "next";
import { Users, Building2, CreditCard, BadgeDollarSign, Sparkles, ShieldAlert } from "lucide-react";
import { getPlatformStats } from "@/lib/admin/stats";
import { StatCard } from "@/components/ui/stat-card";
import { ChartCard } from "@/components/ui/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PLAN_ORDER } from "@/lib/billing/plans";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverview() {
  const s = await getPlatformStats();

  if (!s.configured) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Admin backend not configured"
        description="Set SUPABASE_SERVICE_ROLE_KEY in the environment to enable platform-wide admin data."
      />
    );
  }

  const cards = [
    { label: "Total users", value: s.totalUsers, icon: <Users className="h-4 w-4" />, accent: "from-brand-500 to-coral-500" },
    { label: "Workspaces", value: s.totalWorkspaces, icon: <Building2 className="h-4 w-4" />, accent: "from-sky-500 to-blue-500" },
    { label: "Active subs", value: s.activeSubscriptions, icon: <CreditCard className="h-4 w-4" />, accent: "from-violet-500 to-indigo-500" },
    { label: "Est. MRR", value: `$${s.estMrr.toLocaleString()}`, icon: <BadgeDollarSign className="h-4 w-4" />, accent: "from-emerald-500 to-teal-500" },
    { label: "AI gens (30d)", value: s.aiGenerations30d, icon: <Sparkles className="h-4 w-4" />, accent: "from-amber-400 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground">Real-time health of your SaaS.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={typeof c.value === "number" ? c.value.toLocaleString() : c.value}
            icon={c.icon}
            accent={c.accent}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Plan breakdown">
          <ul className="space-y-3">
            {PLAN_ORDER.map((p) => (
              <li key={p} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{p}</span>
                <span className="font-semibold tabular-nums">{s.planBreakdown[p]}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Recent signups" className="lg:col-span-2" bodyClassName="p-0">
          {s.recentSignups.length === 0 ? (
            <EmptyState title="No signups yet" />
          ) : (
            <ul className="divide-y divide-border">
              {s.recentSignups.map((u, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{u.full_name ?? u.email ?? "—"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
