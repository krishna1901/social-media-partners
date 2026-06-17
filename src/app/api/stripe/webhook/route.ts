import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeWebhookConfigured } from "@/lib/billing/stripe";
import { priceIdToPlan } from "@/lib/billing/stripe-plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { applySubscriptionState, findWorkspaceIdByCustomer } from "@/lib/db/billing";

/**
 * Phase 5 — Stripe webhook.
 *
 * Verifies the signature against the RAW request body, then reconciles the
 * workspace's plan from the subscription's active price using the service-role
 * client (no user session in a webhook). Idempotent: every handler sets the
 * workspace to a deterministic state keyed by the Stripe customer id, so
 * out-of-order deliveries and retries converge.
 *
 * With the secrets unset it responds 200/skipped so demo/preview deploys don't
 * 500 (and Stripe doesn't retry forever).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function customerIdOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export async function POST(request: NextRequest) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: true, skipped: "not_configured" });

  // RAW body is required for signature verification — never request.json().
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return new NextResponse(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "no_service_role" });

  // Prefer the indexed customer id; fall back to metadata when the workspace
  // row hasn't been linked to a customer yet.
  async function resolveWorkspaceId(
    customerId: string | null,
    metaWorkspaceId: string | null
  ): Promise<string | null> {
    if (customerId) {
      const byCustomer = await findWorkspaceIdByCustomer(admin!, customerId);
      if (byCustomer) return byCustomer;
    }
    return metaWorkspaceId;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = customerIdOf(session.customer as never);
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        const workspaceId = await resolveWorkspaceId(customerId, session.client_reference_id ?? null);
        if (!workspaceId || !subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);
        const plan = priceIdToPlan(sub.items.data[0]?.price?.id);
        await applySubscriptionState(admin, {
          workspaceId,
          plan: plan ?? undefined,
          subscriptionId: sub.id,
          status: sub.status,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer as never);
        const metaWs = (sub.metadata?.workspace_id as string | undefined) ?? null;
        const workspaceId = await resolveWorkspaceId(customerId, metaWs);
        if (!workspaceId) break;

        // Unknown price → refresh status but don't guess a plan (plan omitted).
        const plan = priceIdToPlan(sub.items.data[0]?.price?.id);
        await applySubscriptionState(admin, {
          workspaceId,
          plan: plan ?? undefined,
          subscriptionId: sub.id,
          status: sub.status,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer as never);
        const metaWs = (sub.metadata?.workspace_id as string | undefined) ?? null;
        const workspaceId = await resolveWorkspaceId(customerId, metaWs);
        if (!workspaceId) break;

        // Subscription ended → revert to the free Starter tier.
        await applySubscriptionState(admin, {
          workspaceId,
          plan: "starter",
          subscriptionId: null,
          status: "canceled",
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
