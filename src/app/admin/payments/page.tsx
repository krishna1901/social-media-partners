import type { Metadata } from "next";
import { CreditCard, Check } from "lucide-react";
import { AdminConfigSection } from "@/components/admin/config-section";
import { ChartCard } from "@/components/ui/chart-card";
import { PLAN_ORDER, PLANS, isUnlimited } from "@/lib/billing/plans";

export const metadata: Metadata = { title: "Payments" };

function fmt(n: number): string {
  return isUnlimited(n) ? "Unlimited" : n.toLocaleString();
}

export default function AdminPaymentsPage() {
  const plans = (
    <ChartCard
      title="Plan catalog"
      subtitle="Pricing tiers and limits. Map each paid tier to a Stripe recurring price id below."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          return (
            <div
              key={id}
              className={`relative rounded-2xl border p-4 ${
                p.featured ? "border-brand-300 bg-brand-50/40 dark:border-brand-500/40 dark:bg-brand-500/5" : "border-border bg-card"
              }`}
            >
              {p.featured && (
                <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-brand-500 to-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Popular
                </span>
              )}
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {p.price}
                <span className="ml-1 text-xs font-medium text-muted-foreground">{p.cadence}</span>
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-500" /> {fmt(p.limits.connectedAccounts)} accounts
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-500" /> {fmt(p.limits.aiGenerationsPerMonth)} AI gens / mo
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-500" /> {fmt(p.limits.scheduledPosts)} scheduled posts
                </li>
              </ul>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );

  return (
    <AdminConfigSection
      section="payments"
      title="Payments"
      description="Stripe billing configuration. Users self-serve subscribe and upgrade from the front panel; every payment credential and price id is managed here."
      icon={<CreditCard className="h-5 w-5" />}
      intro={plans}
    />
  );
}
