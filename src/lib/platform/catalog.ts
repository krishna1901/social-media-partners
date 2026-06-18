/** Catalog of platform-managed secrets/config, grouped for the admin UI. */
export interface SecretDef {
  key: string;
  label: string;
  /** Secret values are encrypted at rest and shown masked. Non-secret config
   *  (provider name, model id, Stripe price ids) is stored in plaintext. */
  isSecret?: boolean;
}

export interface SecretGroup {
  group: string;
  description: string;
  items: SecretDef[];
}

export const SECRET_GROUPS: SecretGroup[] = [
  {
    group: "AI",
    description: "Powers the Content Studio. Set a key and generation works for every workspace — no user setup.",
    items: [
      { key: "OPENAI_API_KEY", label: "OpenAI API key" },
      { key: "ANTHROPIC_API_KEY", label: "Anthropic API key" },
      { key: "AI_DEFAULT_PROVIDER", label: "Default provider (openai or anthropic)", isSecret: false },
      { key: "AI_DEFAULT_MODEL", label: "Default model id", isSecret: false },
    ],
  },
  {
    group: "LinkedIn",
    description: "OAuth app for LinkedIn publishing.",
    items: [
      { key: "LINKEDIN_CLIENT_ID", label: "Client ID", isSecret: false },
      { key: "LINKEDIN_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "Meta (Facebook & Instagram)",
    description: "OAuth app for Facebook Pages and Instagram.",
    items: [
      { key: "META_APP_ID", label: "App ID", isSecret: false },
      { key: "META_APP_SECRET", label: "App secret" },
    ],
  },
  {
    group: "Google (YouTube)",
    description: "OAuth app for YouTube.",
    items: [
      { key: "GOOGLE_CLIENT_ID", label: "Client ID", isSecret: false },
      { key: "GOOGLE_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "TikTok",
    description: "OAuth app for TikTok.",
    items: [
      { key: "TIKTOK_CLIENT_KEY", label: "Client key", isSecret: false },
      { key: "TIKTOK_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "X (Twitter)",
    description: "OAuth app for X.",
    items: [
      { key: "X_CLIENT_ID", label: "Client ID", isSecret: false },
      { key: "X_CLIENT_SECRET", label: "Client secret" },
    ],
  },
  {
    group: "Stripe",
    description: "Billing. Secret key + webhook secret + recurring price ids.",
    items: [
      { key: "STRIPE_SECRET_KEY", label: "Secret key" },
      { key: "STRIPE_WEBHOOK_SECRET", label: "Webhook secret" },
      { key: "STRIPE_PRICE_PRO", label: "Pro price id", isSecret: false },
      { key: "STRIPE_PRICE_AGENCY", label: "Agency price id", isSecret: false },
    ],
  },
  {
    group: "Platform webhook",
    description: "Outbound webhook for platform events (e.g. post.published). Optional HMAC signing.",
    items: [
      { key: "PLATFORM_WEBHOOK_URL", label: "Webhook URL", isSecret: false },
      { key: "PLATFORM_WEBHOOK_SIGNING_SECRET", label: "Webhook signing secret" },
    ],
  },
  {
    group: "Cron",
    description: "Protects the /api/cron/* endpoints.",
    items: [{ key: "CRON_SECRET", label: "Cron secret" }],
  },
];

export const ALL_SECRET_KEYS: string[] = SECRET_GROUPS.flatMap((g) => g.items.map((i) => i.key));

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
