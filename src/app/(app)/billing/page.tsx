import { CreditCard, Check, Sparkles, Zap, Building2, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWorkspaceUsage } from "@/lib/billing/usage";
import { PLAN_ORDER, PLANS, isUnlimited, type PlanId } from "@/lib/billing/plans";

/**
 * Billing (server) — current plan, live usage vs limits, and plan comparison.
 * The upgrade CTA links to `NEXT_PUBLIC_UPGRADE_URL` when set (real checkout is
 * out of scope); demo/preview shows representative usage.
 */
export const dynamic = "force-dynamic";

const planIcon: Record<PlanId, LucideIcon> = {
  starter: Sparkles,
  pro: Zap,
  agency: Building2,
};

function pct(used: number, limit: number): number {
  if (isUnlimited(limit)) return 6;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function limitLabel(limit: number): string {
  return isUnlimited(limit) ? "∞" : limit.toLocaleString();
}

export default async function BillingPage() {
  const usage = await getWorkspaceUsage();
  const upgradeUrl = process.env.NEXT_PUBLIC_UPGRADE_URL || "";

  const meters = [
    { label: "Connected accounts", metric: usage.connectedAccounts },
    { label: "AI generations this month", metric: usage.aiGenerations },
    { label: "Scheduled posts", metric: usage.scheduledPosts },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Plan & billing"
        description="Manage your subscription, track usage and upgrade as you grow."
        icon={<CreditCard className="h-5 w-5" />}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600">
            Current plan: <span className="capitalize">{usage.plan.name}</span>
          </span>
        }
      />

      {!usage.live && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode — usage figures are illustrative. Sign in to see your workspace&apos;s real usage.
        </div>
      )}

      {/* Usage meters */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-foreground">Usage this period</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {meters.map((m) => (
            <div key={m.label} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {m.metric.used.toLocaleString()} / {limitLabel(m.metric.limit)}
                </span>
              </div>
              <Progress value={pct(m.metric.used, m.metric.limit)} />
            </div>
          ))}
        </div>
      </section>

      {/* Plan comparison */}
      <section className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const Icon = planIcon[id];
          const isCurrent = usage.plan.id === id;
          return (
            <div
              key={id}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-card p-5 shadow-soft transition-all",
                plan.featured ? "border-brand-300 ring-1 ring-brand-200" : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-brand-500" /> {plan.name}
                </span>
                {plan.featured && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.cadence}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-1">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : upgradeUrl ? (
                  <a
                    href={upgradeUrl}
                    className={cn(buttonVariants({ variant: plan.featured ? "gradient" : "outline" }), "w-full")}
                  >
                    Choose {plan.name}
                  </a>
                ) : (
                  <a
                    href="mailto:sales@socialflow.ai?subject=Upgrade%20to%20"
                    className={cn(buttonVariants({ variant: plan.featured ? "gradient" : "outline" }), "w-full")}
                  >
                    Contact sales
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Need a custom plan or invoicing? <span className="font-medium text-foreground">Talk to us</span> — we&apos;ll tailor a workspace to your team.
      </p>
    </div>
  );
}
