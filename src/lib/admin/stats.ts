import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export interface PlatformStats {
  configured: boolean;
  totalUsers: number;
  totalWorkspaces: number;
  planBreakdown: Record<PlanId, number>;
  activeSubscriptions: number;
  estMrr: number;
  aiGenerations30d: number;
  recentSignups: { email: string | null; full_name: string | null; created_at: string }[];
}

function priceNumber(p: string): number {
  const n = Number(p.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const PLAN_IDS: PlanId[] = ["starter", "pro", "agency"];

/** Platform-wide stats via the service-role client (bypasses RLS). */
export async function getPlatformStats(): Promise<PlatformStats> {
  const empty: PlatformStats = {
    configured: false,
    totalUsers: 0,
    totalWorkspaces: 0,
    planBreakdown: { starter: 0, pro: 0, agency: 0 },
    activeSubscriptions: 0,
    estMrr: 0,
    aiGenerations30d: 0,
    recentSignups: [],
  };

  const admin = createAdminClient();
  if (!admin) return empty;

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [usersC, wsRows, aiC, recent] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("workspaces").select("plan, subscription_status"),
    admin.from("ai_generations").select("*", { count: "exact", head: true }).gte("created_at", since),
    admin.from("profiles").select("email, full_name, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const planBreakdown: Record<PlanId, number> = { starter: 0, pro: 0, agency: 0 };
  let activeSubscriptions = 0;
  let estMrr = 0;
  for (const w of (wsRows.data ?? []) as { plan: string | null; subscription_status: string | null }[]) {
    const plan = (PLAN_IDS.includes(w.plan as PlanId) ? (w.plan as PlanId) : "starter");
    planBreakdown[plan] += 1;
    if (plan !== "starter") {
      estMrr += priceNumber(PLANS[plan].price);
      if (w.subscription_status === "active") activeSubscriptions += 1;
    }
  }

  return {
    configured: true,
    totalUsers: usersC.count ?? 0,
    totalWorkspaces: wsRows.data?.length ?? 0,
    planBreakdown,
    activeSubscriptions,
    estMrr,
    aiGenerations30d: aiC.count ?? 0,
    recentSignups: (recent.data ?? []) as PlatformStats["recentSignups"],
  };
}
