import "server-only";
import { getDbContext, isLive } from "@/lib/db/context";
import { getPlan, isUnlimited, type Plan } from "@/lib/billing/plans";

/**
 * Phase 4 — workspace usage + plan limits.
 *
 * Computes current usage against the workspace plan. Demo/preview returns
 * representative numbers so the billing page renders without auth.
 */

export interface UsageMetric {
  used: number;
  /** -1 = unlimited. */
  limit: number;
}

export interface WorkspaceUsage {
  live: boolean;
  plan: Plan;
  connectedAccounts: UsageMetric;
  aiGenerations: UsageMetric;
  scheduledPosts: UsageMetric;
}

function monthStartISO(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getWorkspaceUsage(): Promise<WorkspaceUsage> {
  const ctx = await getDbContext();

  if (!isLive(ctx)) {
    const plan = getPlan("pro");
    return {
      live: false,
      plan,
      connectedAccounts: { used: 3, limit: plan.limits.connectedAccounts },
      aiGenerations: { used: 128, limit: plan.limits.aiGenerationsPerMonth },
      scheduledPosts: { used: 12, limit: plan.limits.scheduledPosts },
    };
  }

  const { data: ws } = await ctx.supabase
    .from("workspaces")
    .select("plan")
    .eq("id", ctx.workspaceId)
    .maybeSingle();
  const plan = getPlan((ws?.plan as string | undefined) ?? "starter");
  const workspaceId = ctx.workspaceId;
  const supabase = ctx.supabase;

  const [accountsRes, aiRes, scheduledRes] = await Promise.all([
    supabase
      .from("connected_accounts")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "connected"),
    supabase
      .from("ai_generations")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", monthStartISO()),
    supabase
      .from("scheduled_posts")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", ["queued", "processing"]),
  ]);

  const accounts = accountsRes.count ?? 0;
  const ai = aiRes.count ?? 0;
  const scheduled = scheduledRes.count ?? 0;

  return {
    live: true,
    plan,
    connectedAccounts: { used: accounts, limit: plan.limits.connectedAccounts },
    aiGenerations: { used: ai, limit: plan.limits.aiGenerationsPerMonth },
    scheduledPosts: { used: scheduled, limit: plan.limits.scheduledPosts },
  };
}

/**
 * Whether the active workspace may run another AI generation this month.
 * Demo/preview always allows. Enforced in the AI action.
 */
export async function checkAiQuota(): Promise<{ allowed: boolean; used: number; limit: number }> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) return { allowed: true, used: 0, limit: -1 };

  const { data: ws } = await ctx.supabase
    .from("workspaces")
    .select("plan")
    .eq("id", ctx.workspaceId)
    .maybeSingle();
  const plan = getPlan((ws?.plan as string | undefined) ?? "starter");
  const limit = plan.limits.aiGenerationsPerMonth;
  if (isUnlimited(limit)) return { allowed: true, used: 0, limit };

  const { count } = await ctx.supabase
    .from("ai_generations")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspaceId)
    .gte("created_at", monthStartISO());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}
