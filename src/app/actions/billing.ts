"use server";

import { getDbContext, isLive } from "@/lib/db/context";
import { getStripe, isStripeConfigured, appUrl } from "@/lib/billing/stripe";
import { planToPriceId, isStripePlanConfigured } from "@/lib/billing/stripe-plans";
import { getWorkspaceBilling, setWorkspaceCustomerId } from "@/lib/db/billing";
import type { PlanId } from "@/lib/billing/plans";

type BillingActionResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Phase 5 — start a Stripe Checkout session for a paid plan.
 *
 * Accepts only a PlanId; the price is resolved server-side so a client can never
 * inject an arbitrary Stripe price. Returns a hosted Checkout URL for the client
 * to redirect to. Safe no-op (clear error) in demo mode / when signed out.
 */
export async function startCheckoutAction(targetPlan: PlanId): Promise<BillingActionResult> {
  if (!isStripeConfigured()) return { ok: false, error: "Billing is not configured." };
  if (targetPlan === "starter") {
    return { ok: false, error: "Starter is free — downgrade from the billing portal." };
  }
  if (!isStripePlanConfigured(targetPlan)) {
    return { ok: false, error: "That plan is not available for checkout yet." };
  }

  const ctx = await getDbContext();
  if (!isLive(ctx)) return { ok: false, error: "Please sign in to manage billing." };

  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Billing is not configured." };

  try {
    const billing = await getWorkspaceBilling(ctx.supabase, ctx.workspaceId);
    let customerId = billing?.stripe_customer_id ?? null;

    if (!customerId) {
      const {
        data: { user },
      } = await ctx.supabase.auth.getUser();
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        metadata: { workspace_id: ctx.workspaceId },
      });
      customerId = customer.id;
      await setWorkspaceCustomerId(ctx.supabase, ctx.workspaceId, customerId);
    }

    const price = planToPriceId(targetPlan)!;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl()}/billing?checkout=success`,
      cancel_url: `${appUrl()}/billing?checkout=cancel`,
      client_reference_id: ctx.workspaceId,
      subscription_data: { metadata: { workspace_id: ctx.workspaceId } },
      allow_promotion_codes: true,
    });

    if (!session.url) return { ok: false, error: "Could not start checkout." };
    return { ok: true, url: session.url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Checkout failed." };
  }
}

/**
 * Phase 5 — open the Stripe Billing Portal for the workspace's customer.
 * Handles upgrades / downgrades / cancellation; changes flow back via the
 * webhook. Returns the portal URL for the client to redirect to.
 */
export async function openBillingPortalAction(): Promise<BillingActionResult> {
  if (!isStripeConfigured()) return { ok: false, error: "Billing is not configured." };

  const ctx = await getDbContext();
  if (!isLive(ctx)) return { ok: false, error: "Please sign in to manage billing." };

  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Billing is not configured." };

  try {
    const billing = await getWorkspaceBilling(ctx.supabase, ctx.workspaceId);
    if (!billing?.stripe_customer_id) {
      return { ok: false, error: "No billing account yet — choose a plan to get started." };
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${appUrl()}/billing`,
    });
    return { ok: true, url: session.url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not open billing portal." };
  }
}
