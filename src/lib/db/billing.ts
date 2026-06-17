import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/billing/plans";

/**
 * Phase 5 — workspace billing data helpers.
 *
 * Keeps the Stripe-related SQL in one place. The webhook passes a service-role
 * client (bypasses RLS); the checkout/portal actions pass the user-session
 * client (RLS-scoped to the owner/admin).
 */

export interface WorkspaceBilling {
  plan: PlanId;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
}

export async function getWorkspaceBilling(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspaceBilling | null> {
  const { data } = await supabase
    .from("workspaces")
    .select("plan, stripe_customer_id, stripe_subscription_id, subscription_status")
    .eq("id", workspaceId)
    .maybeSingle();
  return (data as WorkspaceBilling | null) ?? null;
}

/** Persist the Stripe customer id (checkout action, user-session client). */
export async function setWorkspaceCustomerId(
  supabase: SupabaseClient,
  workspaceId: string,
  customerId: string
): Promise<void> {
  await supabase
    .from("workspaces")
    .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
    .eq("id", workspaceId);
}

/** Resolve a workspace id from a Stripe customer id (webhook lookup). */
export async function findWorkspaceIdByCustomer(
  admin: SupabaseClient,
  customerId: string
): Promise<string | null> {
  const { data } = await admin
    .from("workspaces")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Service-role update of subscription state (webhook). Omit `plan` to leave the
 * current plan unchanged (e.g. an unknown price we won't guess a plan for).
 * Idempotent: it sets the row to a deterministic state regardless of order.
 */
export async function applySubscriptionState(
  admin: SupabaseClient,
  args: {
    workspaceId: string;
    plan?: PlanId;
    subscriptionId: string | null;
    status: string | null;
  }
): Promise<void> {
  const update: Record<string, unknown> = {
    stripe_subscription_id: args.subscriptionId,
    subscription_status: args.status,
    updated_at: new Date().toISOString(),
  };
  if (args.plan) update.plan = args.plan;
  await admin.from("workspaces").update(update).eq("id", args.workspaceId);
}
