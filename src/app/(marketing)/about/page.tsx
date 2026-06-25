import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "SocialFlow AI is building the AI content command center for creators, marketers, and agencies.",
  alternates: { canonical: "/about" },
};

const values = [
  { title: "Creators first", body: "We obsess over the daily workflow of people who publish — fewer clicks, more reach." },
  { title: "AI with taste", body: "AI should sound like you, not a robot. Our generators are tuned for on-brand, human output." },
  { title: "One calm command center", body: "Replace a dozen tabs with a single, premium workspace that's a joy to use." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Built for people who publish</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            SocialFlow AI helps creators, marketers, and agencies plan, create, and grow across every
            platform — without the busywork.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
          <p className="text-lg leading-relaxed text-foreground">
            Social media moves fast, and the tools to manage it never kept up. Teams juggle a content
            planner, an AI writer, a scheduler, an analytics tab, and an inbox — switching contexts all
            day. We built SocialFlow AI to bring that entire workflow into one calm, AI-powered
            command center, so you can spend your energy on the work that actually grows an audience.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-base font-semibold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 text-center sm:px-6">
        <Link href="/signup">
          <Button variant="gradient" size="lg" className="rounded-full">
            Join SocialFlow AI <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </>
  );
}
