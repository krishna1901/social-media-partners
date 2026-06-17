"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startCheckoutAction, openBillingPortalAction } from "@/app/actions/billing";
import type { PlanId } from "@/lib/billing/plans";

type BillingResult = { ok: true; url: string } | { ok: false; error: string };

interface PlanActionsProps {
  planId: PlanId;
  planName: string;
  featured: boolean;
  isCurrent: boolean;
  live: boolean;
  stripeConfigured: boolean;
  hasCustomer: boolean;
}

/**
 * Per-plan CTA on /billing. A small client island (mirrors the analytics
 * sync-button pattern) that calls a server action inside a transition and
 * redirects to the Stripe-hosted Checkout / Billing Portal URL it returns.
 */
export function PlanActions({
  planId,
  planName,
  featured,
  isCurrent,
  live,
  stripeConfigured,
  hasCustomer,
}: PlanActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const variant = featured ? "gradient" : "outline";
  const billingEnabled = live && stripeConfigured;

  function go(run: () => Promise<BillingResult>) {
    setError(null);
    startTransition(async () => {
      const res = await run();
      if (res.ok) {
        window.location.href = res.url;
      } else {
        setError(res.error);
      }
    });
  }

  const errorNote = error ? <p className="text-center text-xs text-destructive">{error}</p> : null;

  // The plan the workspace is currently on.
  if (isCurrent) {
    // Free Starter with no Stripe customer → static badge.
    if (!hasCustomer) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Current plan
        </Button>
      );
    }
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          disabled={pending || !billingEnabled}
          onClick={() => go(openBillingPortalAction)}
        >
          {pending ? "Opening…" : "Manage billing"}
        </Button>
        {errorNote}
      </div>
    );
  }

  // Starter as a (non-current) target → downgrade happens in the portal.
  if (planId === "starter") {
    if (hasCustomer && billingEnabled) {
      return (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => go(openBillingPortalAction)}
          >
            {pending ? "Opening…" : "Downgrade"}
          </Button>
          {errorNote}
        </div>
      );
    }
    return (
      <Button variant="outline" className="w-full" disabled>
        Free plan
      </Button>
    );
  }

  // A paid plan (pro / agency) the workspace is not on.
  if (!billingEnabled) {
    return (
      <div className="space-y-2">
        <Button variant={variant} className="w-full" disabled>
          Choose {planName}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          {live ? "Billing not configured" : "Sign in to upgrade"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        className="w-full"
        disabled={pending}
        onClick={() => go(() => startCheckoutAction(planId))}
      >
        {pending ? "Redirecting…" : `Choose ${planName}`}
      </Button>
      {errorNote}
    </div>
  );
}
