/**
 * Phase 4 — commercial plans + limits.
 *
 * Pure config (no server-only) so it can be referenced from server and client.
 * `-1` means unlimited. Limits are enforced server-side in the relevant actions.
 */

export type PlanId = "starter" | "pro" | "agency";

export interface PlanLimits {
  /** Max connected social accounts. */
  connectedAccounts: number;
  /** AI generations per calendar month. */
  aiGenerationsPerMonth: number;
  /** Concurrent scheduled/queued posts. */
  scheduledPosts: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  limits: PlanLimits;
  /** Highlight as the recommended plan in pricing UI. */
  featured?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: "$0",
    cadence: "forever",
    tagline: "For solo creators finding their voice.",
    limits: { connectedAccounts: 2, aiGenerationsPerMonth: 50, scheduledPosts: 30 },
    features: [
      "2 connected accounts",
      "50 AI generations / month",
      "30 scheduled posts",
      "Content Studio + calendar",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "per month",
    tagline: "For serious creators and small teams.",
    featured: true,
    limits: { connectedAccounts: 8, aiGenerationsPerMonth: 1000, scheduledPosts: 500 },
    features: [
      "8 connected accounts",
      "1,000 AI generations / month",
      "500 scheduled posts",
      "Analytics + inbox sync",
      "Priority publishing",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: "$99",
    cadence: "per month",
    tagline: "For agencies managing many brands.",
    limits: { connectedAccounts: -1, aiGenerationsPerMonth: -1, scheduledPosts: -1 },
    features: [
      "Unlimited connected accounts",
      "Unlimited AI generations",
      "Unlimited scheduling",
      "All integrations",
      "Dedicated support",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "pro", "agency"];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "starter"] ?? PLANS.starter;
}

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}
