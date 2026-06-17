import "server-only";
import type { PlanId } from "@/lib/billing/plans";

/**
 * Phase 5 — Stripe Price mapping.
 *
 * Maps our internal PlanId to the recurring Stripe Price IDs supplied via env.
 * Server-only on purpose: Price IDs come from server env, and the reverse map is
 * the authoritative resolver used by the webhook — we never trust a price id
 * supplied by the client. `starter` is free (no Stripe Price).
 */

/** Env var holding each paid plan's recurring Stripe Price id (`price_…`). */
const PRICE_ENV: Record<Exclude<PlanId, "starter">, string> = {
  pro: "STRIPE_PRICE_PRO",
  agency: "STRIPE_PRICE_AGENCY",
};

/** Stripe Price id for a plan, or `null` when free/unconfigured. */
export function planToPriceId(plan: PlanId): string | null {
  if (plan === "starter") return null;
  return process.env[PRICE_ENV[plan]] || null;
}

/** Whether a (paid) plan has its Stripe Price configured. */
export function isStripePlanConfigured(plan: PlanId): boolean {
  return Boolean(planToPriceId(plan));
}

/**
 * Authoritative reverse map: a live Stripe Price id → our PlanId. Returns `null`
 * for unknown/unmapped prices so the webhook never guesses a plan.
 */
export function priceIdToPlan(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  const pro = process.env.STRIPE_PRICE_PRO;
  const agency = process.env.STRIPE_PRICE_AGENCY;
  if (pro && priceId === pro) return "pro";
  if (agency && priceId === agency) return "agency";
  return null;
}
