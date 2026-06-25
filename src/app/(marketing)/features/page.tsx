import type { Metadata } from "next";
import Link from "next/link";
import { Wand2, CalendarDays, BarChart2, Inbox, Bot, Crosshair, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything in SocialFlow AI — AI Content Studio, scheduling, analytics, unified inbox, automations, and competitor intelligence.",
  alternates: { canonical: "/features" },
};

const sections = [
  { icon: Wand2, title: "AI Content Studio", body: "Turn a one-line idea into hooks, captions, scripts, hashtags, and full carousels — written in your brand voice. Save, refine, and convert any draft into a scheduled post.", points: ["10+ purpose-built generators", "Brand voice & tone controls", "One-click convert to post"] },
  { icon: CalendarDays, title: "Planning & scheduling", body: "A visual calendar and smart queue publish to every platform at the best times. Plan weeks ahead and keep your pipeline full.", points: ["Drag-friendly calendar", "Smart posting windows", "Per-platform formatting"] },
  { icon: BarChart2, title: "Analytics", body: "Understand what's working with clean dashboards for reach, engagement, and top formats — refreshed automatically.", points: ["Engagement & reach trends", "Best-performing content", "Per-channel breakdowns"] },
  { icon: Inbox, title: "Unified inbox", body: "Every comment and DM across platforms in one stream. Reply, triage, and never let a conversation go cold.", points: ["Cross-platform messages", "Reply & triage in one place", "Automation-assisted replies"] },
  { icon: Bot, title: "Automations", body: "Run playbooks that auto-reply, capture leads, and keep engagement high — with optional human approval before anything sends.", points: ["Trigger-based playbooks", "Lead capture", "Human-in-the-loop approval"] },
  { icon: Crosshair, title: "Competitor intelligence", body: "Track the brands you watch, see their best content, and turn proven ideas into your next winning post.", points: ["Watchlists", "Top-post discovery", "Idea inspiration"] },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">One platform, the whole workflow</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            From the first idea to the analytics that prove it worked — SocialFlow AI replaces a stack of tools.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:px-6">
        {sections.map((s, i) => (
          <div
            key={s.title}
            className={`grid items-center gap-6 rounded-3xl border border-border bg-card p-7 shadow-soft sm:grid-cols-[1fr_1.4fr] sm:p-9 ${i % 2 === 1 ? "sm:[&>div:first-child]:order-2" : ""}`}
          >
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-lg shadow-brand-500/25">
                <s.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">{s.title}</h2>
              <p className="mt-2 text-muted-foreground">{s.body}</p>
            </div>
            <ul className="grid gap-2.5">
              {s.points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="px-4 pb-20 text-center sm:px-6">
        <Link href="/signup">
          <Button variant="gradient" size="lg" className="rounded-full">
            Start free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </>
  );
}
