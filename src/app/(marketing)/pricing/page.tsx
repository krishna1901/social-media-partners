import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { SoftwareApplicationJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for SocialFlow AI. Start free, upgrade to Pro or Agency as you grow.",
  alternates: { canonical: "/pricing" },
};

const faqs = [
  {
    q: "Is there a free plan?",
    a: "Yes — the Starter plan is free forever and includes the Content Studio, calendar, and up to 2 connected accounts.",
  },
  {
    q: "Do I need to bring my own API keys?",
    a: "No. AI generation and integrations are powered by the platform — you just connect your social accounts and start creating.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. Upgrade, downgrade, or cancel anytime from your billing settings. Changes take effect immediately.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards via Stripe, our secure payments provider.",
  },
];

const included = [
  "AI Content Studio",
  "Scheduling & calendar",
  "Analytics dashboards",
  "Unified inbox",
  "Secure social connections",
];

export default function PricingPage() {
  return (
    <>
      <SoftwareApplicationJsonLd />
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Pricing that scales with you</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free and upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <PricingCards />
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="text-sm font-semibold text-foreground">Every plan includes:</span>
          {included.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-brand-500" /> {f}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <div className="mt-10 space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="font-semibold text-foreground">{f.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still have questions?{" "}
          <Link href="/contact" className="font-semibold text-brand-600 hover:underline">Talk to us →</Link>
        </p>
      </section>
    </>
  );
}
