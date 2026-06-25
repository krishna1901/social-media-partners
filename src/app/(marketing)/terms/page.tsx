import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of SocialFlow AI.",
  alternates: { canonical: "/terms" },
};

const sections = [
  { h: "Acceptance of terms", p: "By creating an account or using SocialFlow AI, you agree to these Terms of Service. If you do not agree, do not use the service." },
  { h: "Your account", p: "You are responsible for the activity on your account and for keeping your credentials secure. You must be at least 16 years old, or the age of digital consent in your country, to use SocialFlow AI." },
  { h: "Acceptable use", p: "You agree not to use SocialFlow AI to publish unlawful, abusive, or infringing content, to violate the terms of any connected platform, or to abuse our AI or sending capabilities (including spam)." },
  { h: "Plans and billing", p: "Paid plans renew automatically until cancelled. You can upgrade, downgrade, or cancel at any time; cancellations take effect at the end of the current billing period unless stated otherwise. Fees are non-refundable except where required by law." },
  { h: "AI-generated content", p: "AI features may produce inaccurate or unintended output. You are responsible for reviewing and approving any content before it is published." },
  { h: "Service availability", p: "We work hard to keep SocialFlow AI available and reliable, but the service is provided “as is” without warranties. We may modify or discontinue features over time." },
  { h: "Limitation of liability", p: "To the maximum extent permitted by law, SocialFlow AI is not liable for indirect, incidental, or consequential damages arising from your use of the service." },
  { h: "Contact", p: "Questions about these terms? Email legal@socialflowapp.com." },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <div key={s.h}>
            <h2 className="text-lg font-semibold text-foreground">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
