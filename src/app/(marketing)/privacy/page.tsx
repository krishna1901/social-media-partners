import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SocialFlow AI collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  { h: "Information we collect", p: "We collect the account details you provide (name, email), the content and settings you create in the app, and the social accounts you choose to connect. We also collect basic usage and device data to operate and improve the service." },
  { h: "How we use your information", p: "We use your information to provide and improve SocialFlow AI, to publish and schedule content on your behalf to the platforms you connect, to power AI features, to process payments, and to communicate with you about your account." },
  { h: "Connected social accounts", p: "When you connect a social account, we store access tokens encrypted at rest and use them only to perform the actions you request (such as publishing posts or syncing analytics). You can disconnect an account at any time." },
  { h: "Data sharing", p: "We do not sell your personal data. We share data only with the service providers needed to run SocialFlow AI (such as our hosting, database, payments, and AI providers) and as required by law." },
  { h: "Data security", p: "We use industry-standard measures including encryption in transit and at rest, scoped database access, and strict access controls to protect your data." },
  { h: "Your rights", p: "You can access, update, export, or delete your data from your account settings, or by contacting us. Deleting your account removes your workspaces and associated content." },
  { h: "Contact", p: "Questions about this policy? Email privacy@socialflowapp.com." },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
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
