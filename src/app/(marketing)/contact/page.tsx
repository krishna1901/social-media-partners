import type { Metadata } from "next";
import { Mail, MessageSquare, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the SocialFlow AI team — sales, support, and partnerships.",
  alternates: { canonical: "/contact" },
};

const channels = [
  { icon: Mail, title: "Email us", body: "We reply within one business day.", action: "hello@socialflowapp.com", href: "mailto:hello@socialflowapp.com" },
  { icon: LifeBuoy, title: "Support", body: "Already a customer? We've got you.", action: "support@socialflowapp.com", href: "mailto:support@socialflowapp.com" },
  { icon: MessageSquare, title: "Sales & partnerships", body: "Agencies and teams, let's talk.", action: "sales@socialflowapp.com", href: "mailto:sales@socialflowapp.com" },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Questions, feedback, or a partnership idea? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {channels.map((c) => (
            <div key={c.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
              <a href={c.href} className="mt-4">
                <Button variant="outline" className="w-full">{c.action}</Button>
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
