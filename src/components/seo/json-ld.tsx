import { PLAN_ORDER, PLANS } from "@/lib/billing/plans";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

/** Inline a JSON-LD <script>. Data is fully static/trusted, so inlining is safe. */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "SocialFlow AI",
        url: appUrl,
        logo: `${appUrl}/favicon.ico`,
        description:
          "AI-powered content intelligence, scheduling, analytics, inbox, and automation platform.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@socialflowapp.com",
          contactType: "customer support",
        },
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "SocialFlow AI",
        url: appUrl,
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const offers = PLAN_ORDER.map((id) => {
    const p = PLANS[id];
    return {
      "@type": "Offer",
      name: p.name,
      price: p.price.replace(/[^0-9.]/g, "") || "0",
      priceCurrency: "USD",
      category: p.cadence,
    };
  });
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "SocialFlow AI",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: appUrl,
        offers,
      }}
    />
  );
}
