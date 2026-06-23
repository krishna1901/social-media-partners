/** Catalog of platform-managed secrets/config, grouped for the admin UI. */
export interface SecretDef {
  key: string;
  label: string;
  /** Secret values are encrypted at rest and shown masked. Non-secret config
   *  (provider name, model id, Stripe price ids) is stored in plaintext. */
  isSecret?: boolean;
  /** Optional helper text shown under the field in the admin UI. */
  hint?: string;
}

/** Admin information-architecture sections. Each admin config page renders the
 *  groups for one section. */
export type SecretSection =
  | "ai"
  | "social"
  | "payments"
  | "automation"
  | "webhooks";

export interface SecretGroup {
  group: string;
  description: string;
  /** Which admin page this group appears on. */
  section: SecretSection;
  items: SecretDef[];
}

export const SECRET_GROUPS: SecretGroup[] = [
  {
    group: "AI",
    description: "Powers the Content Studio. Set a key and generation works for every workspace — no user setup.",
    section: "ai",
    items: [
      { key: "OPENAI_API_KEY", label: "OpenAI API key" },
      { key: "ANTHROPIC_API_KEY", label: "Anthropic API key" },
      { key: "AI_DEFAULT_PROVIDER", label: "Default provider (openai or anthropic)", isSecret: false },
      { key: "AI_DEFAULT_MODEL", label: "Default model id", isSecret: false, hint: "e.g. claude-opus-4-8 or gpt-4o-mini" },
    ],
  },
  {
    group: "LinkedIn",
    description: "OAuth app for LinkedIn publishing.",
    section: "social",
    items: [
      { key: "LINKEDIN_CLIENT_ID", label: "Client ID", isSecret: false },
      { key: "LINKEDIN_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "Meta (Facebook & Instagram)",
    description: "OAuth app for Facebook Pages and Instagram.",
    section: "social",
    items: [
      { key: "META_APP_ID", label: "App ID", isSecret: false },
      { key: "META_APP_SECRET", label: "App secret" },
    ],
  },
  {
    group: "Google (YouTube)",
    description: "OAuth app for YouTube.",
    section: "social",
    items: [
      { key: "GOOGLE_CLIENT_ID", label: "Client ID", isSecret: false },
      { key: "GOOGLE_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "TikTok",
    description: "OAuth app for TikTok.",
    section: "social",
    items: [
      { key: "TIKTOK_CLIENT_KEY", label: "Client key", isSecret: false },
      { key: "TIKTOK_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "X (Twitter)",
    description: "OAuth app for X.",
    section: "social",
    items: [
      { key: "X_CLIENT_ID", label: "Client ID", isSecret: false },
      { key: "X_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "Stripe",
    description: "Billing. Secret key + webhook secret + recurring price ids.",
    section: "payments",
    items: [
      { key: "STRIPE_SECRET_KEY", label: "Secret key" },
      { key: "STRIPE_WEBHOOK_SECRET", label: "Webhook secret" },
      { key: "STRIPE_PRICE_PRO", label: "Pro price id", isSecret: false },
      { key: "STRIPE_PRICE_AGENCY", label: "Agency price id", isSecret: false },
    ],
  },
  {
    group: "n8n / Workflows",
    description: "Connect SocialFlow to an n8n instance to run external automation workflows.",
    section: "automation",
    items: [
      { key: "N8N_BASE_URL", label: "n8n base URL", isSecret: false, hint: "e.g. https://n8n.yourdomain.com" },
      { key: "N8N_API_KEY", label: "n8n API key" },
    ],
  },
  {
    group: "Cron",
    description: "Protects the /api/cron/* endpoints that publish posts, sync analytics and run automations.",
    section: "automation",
    items: [{ key: "CRON_SECRET", label: "Cron secret" }],
  },
  {
    group: "Platform webhook",
    description: "Outbound webhook for platform events (e.g. post.published). Optional HMAC signing.",
    section: "webhooks",
    items: [
      { key: "PLATFORM_WEBHOOK_URL", label: "Webhook URL", isSecret: false },
      { key: "PLATFORM_WEBHOOK_SIGNING_SECRET", label: "Webhook signing secret" },
    ],
  },
];

export const ALL_SECRET_KEYS: string[] = SECRET_GROUPS.flatMap((g) => g.items.map((i) => i.key));

/** Groups that belong to a given admin section. */
export function groupsForSection(section: SecretSection): SecretGroup[] {
  return SECRET_GROUPS.filter((g) => g.section === section);
}

/** Distinct secret keys used by a given admin section (for status lookups). */
export function sectionKeys(section: SecretSection): string[] {
  return groupsForSection(section).flatMap((g) => g.items.map((i) => i.key));
}

export function isSecretKey(key: string): boolean {
  for (const g of SECRET_GROUPS) {
    const item = g.items.find((i) => i.key === key);
    if (item) return item.isSecret ?? true;
  }
  return true;
}

export function isKnownSecretKey(key: string): boolean {
  return ALL_SECRET_KEYS.includes(key);
}
