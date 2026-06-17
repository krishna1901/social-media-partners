import "server-only";
import Stripe from "stripe";

/**
 * Phase 5 — Stripe client + capability guards.
 *
 * Server-only. With no `STRIPE_SECRET_KEY` the whole billing feature degrades to
 * a safe no-op so the app still builds and previews in demo mode. Never import
 * this into client code, and never expose the secret or webhook signing key.
 */

let cached: Stripe | null = null;

/** True when a Stripe secret key is present (checkout / portal can run). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True when both the secret key and the webhook signing secret are present. */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Shared Stripe client, or `null` when unconfigured. We intentionally do NOT pin
 * `apiVersion` so the SDK uses the version its TypeScript types were generated
 * against, keeping runtime and types in lockstep.
 */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!cached) cached = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return cached;
}

/** Absolute app origin for building return URLs (mirrors the OAuth routes). */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
