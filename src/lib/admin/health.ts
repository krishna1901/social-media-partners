import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEncryptionConfigured } from "@/lib/security/crypto";
import { getSecretStatuses } from "@/lib/platform/secrets";
import { ALL_SECRET_KEYS } from "@/lib/platform/catalog";

/**
 * Production health report for the admin-only `/admin/health` page.
 *
 * IMPORTANT: this module reports **presence and reachability only** — it never
 * returns, logs, or otherwise exposes a secret value. Every check resolves to a
 * coarse status (healthy / configured / missing / warn / error) plus a
 * human-readable, secret-free `detail` string.
 */

/** The expected Storage buckets, mirroring `supabase/schema.sql`. */
export const EXPECTED_BUCKETS = ["media", "thumbnails", "carousels", "videos", "zips"] as const;

export type HealthStatus = "healthy" | "configured" | "missing" | "warn" | "error";

export interface HealthItem {
  /** Stable id (handy for keys). */
  id: string;
  label: string;
  status: HealthStatus;
  /** Secret-free, human-readable explanation. NEVER a secret value. */
  detail?: string;
  /** Where a config value resolved from — never the value itself. */
  source?: "saved" | "env" | null;
  /** Soft requirement: missing is acceptable, just noted. */
  optional?: boolean;
}

export interface HealthSection {
  title: string;
  description?: string;
  items: HealthItem[];
}

export type ChecklistStatus = "done" | "todo" | "manual";

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  detail?: string;
}

export interface HealthReport {
  configured: boolean;
  sections: HealthSection[];
  checklist: ChecklistItem[];
  summary: { healthy: number; attention: number; errors: number };
}

export interface HealthInput {
  /** Request-scoped, authenticated Supabase client (the super-admin's session). */
  supabase: SupabaseClient | null;
  /** True when the viewer is the platform super-admin (guaranteed by the layout). */
  isSuperAdmin: boolean;
}

/** Production app origin used for redirect/webhook URLs (public, not a secret). */
export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function isProductionUrl(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

/** Live reachability check against Postgres. Prefers the service role; falls back
 *  to the authenticated client (RLS-scoped) so it still works without one. */
async function checkDatabase(authed: SupabaseClient | null): Promise<HealthItem> {
  const client = createAdminClient() ?? authed;
  if (!client) {
    return { id: "db", label: "Database reachable", status: "warn", detail: "No client available to test." };
  }
  try {
    const { error, count } = await client
      .from("profiles")
      .select("id", { head: true, count: "exact" });
    if (error) {
      return { id: "db", label: "Database reachable", status: "error", detail: error.message };
    }
    return {
      id: "db",
      label: "Database reachable",
      status: "healthy",
      detail: typeof count === "number" ? `Connected — ${count} profile row(s) visible.` : "Connected.",
    };
  } catch (err) {
    return { id: "db", label: "Database reachable", status: "error", detail: errMessage(err) };
  }
}

/** Lists Storage buckets (service-role) and verifies the expected set exists. */
async function checkStorage(): Promise<HealthItem> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      id: "storage",
      label: "Storage buckets reachable",
      status: "warn",
      detail: "Set SUPABASE_SERVICE_ROLE_KEY to verify bucket reachability.",
    };
  }
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      return { id: "storage", label: "Storage buckets reachable", status: "error", detail: error.message };
    }
    const ids = new Set((data ?? []).map((b) => b.id));
    const missing = EXPECTED_BUCKETS.filter((b) => !ids.has(b));
    if (missing.length) {
      return {
        id: "storage",
        label: "Storage buckets reachable",
        status: "warn",
        detail: `Reachable, but missing bucket(s): ${missing.join(", ")}. Re-run supabase/schema.sql.`,
      };
    }
    return {
      id: "storage",
      label: "Storage buckets reachable",
      status: "healthy",
      detail: `All ${EXPECTED_BUCKETS.length} buckets present.`,
    };
  } catch (err) {
    return { id: "storage", label: "Storage buckets reachable", status: "error", detail: errMessage(err) };
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error.";
}

/**
 * Build the full health report. All checks are guarded so the function never
 * throws and stays build-safe when env vars / the service role are missing.
 */
export async function getHealthReport(input: HealthInput): Promise<HealthReport> {
  const configured = isSupabaseConfigured();

  // Presence + source for every catalog-managed key (booleans only, no values).
  const statuses = await getSecretStatuses([...ALL_SECRET_KEYS]);
  const has = (key: string) => Boolean(statuses[key]?.setInDb || statuses[key]?.setInEnv);
  const sourceOf = (key: string): "saved" | "env" | null =>
    statuses[key]?.setInDb ? "saved" : statuses[key]?.setInEnv ? "env" : null;

  // Env-only secrets (never in the platform_secrets catalog).
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasEncryption = isEncryptionConfigured();
  const urlFromEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const anonFromEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  // Live reachability checks run in parallel.
  const [dbItem, storageItem] = await Promise.all([checkDatabase(input.supabase), checkStorage()]);

  const presence = (
    id: string,
    label: string,
    ok: boolean,
    opts: { detail?: string; source?: "saved" | "env" | null; optional?: boolean } = {}
  ): HealthItem => ({
    id,
    label,
    status: ok ? "configured" : opts.optional ? "missing" : "missing",
    detail: opts.detail,
    source: opts.source ?? null,
    optional: opts.optional,
  });

  const oauthDetail = (idKey: string, secretKey: string): string | undefined => {
    const idSrc = sourceOf(idKey);
    const secretSrc = sourceOf(secretKey);
    if (!idSrc && !secretSrc) return "Client id + secret not set.";
    if (!idSrc) return "Client secret set, client id missing.";
    if (!secretSrc) return "Client id set, client secret missing.";
    return `Client id + secret set (${idSrc === secretSrc ? idSrc : `${idSrc}/${secretSrc}`}).`;
  };

  const sections: HealthSection[] = [
    {
      title: "Core services & security",
      description: "Supabase connection, encryption, and live database/storage reachability.",
      items: [
        {
          id: "supabase-url",
          label: "Supabase URL present",
          status: configured ? "healthy" : "warn",
          detail: configured
            ? urlFromEnv
              ? "Set via NEXT_PUBLIC_SUPABASE_URL."
              : "Using baked default project URL."
            : "Demo mode (NEXT_PUBLIC_DEMO_MODE=true) — live DB disabled.",
        },
        {
          id: "supabase-anon",
          label: "Supabase anon key present",
          status: configured ? "healthy" : "warn",
          detail: configured
            ? anonFromEnv
              ? "Set via NEXT_PUBLIC_SUPABASE_ANON_KEY."
              : "Using baked default publishable key."
            : "Demo mode — no live auth.",
        },
        {
          id: "service-role",
          label: "Supabase service role present",
          status: hasServiceRole ? "configured" : "missing",
          detail: hasServiceRole
            ? "SUPABASE_SERVICE_ROLE_KEY set — cron runners, Stripe webhook & admin tools enabled."
            : "Set SUPABASE_SERVICE_ROLE_KEY for cron runners, the Stripe webhook & admin reads.",
        },
        {
          id: "encryption-key",
          label: "TOKEN_ENCRYPTION_KEY present",
          status: hasEncryption ? "configured" : "missing",
          detail: hasEncryption
            ? "Encryption ready — OAuth tokens & stored secrets are protected."
            : "Set TOKEN_ENCRYPTION_KEY (min 16 chars) to store secrets & connect accounts.",
        },
        dbItem,
        storageItem,
        {
          id: "super-admin",
          label: "Current user is super admin",
          status: input.isSuperAdmin ? "healthy" : "error",
          detail: input.isSuperAdmin
            ? "Authenticated as the platform super-admin."
            : "This page should be unreachable without super-admin.",
        },
      ],
    },
    {
      title: "Platform integrations (OAuth apps)",
      description: "Per-platform OAuth app credentials. Stored in Platform Keys or env. Missing platforms simply stay disconnected.",
      items: [
        presence("linkedin", "LinkedIn app config present", has("LINKEDIN_CLIENT_ID") && has("LINKEDIN_CLIENT_SECRET"), {
          detail: oauthDetail("LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"),
          source: sourceOf("LINKEDIN_CLIENT_ID"),
          optional: true,
        }),
        presence("meta", "Meta app config present", has("META_APP_ID") && has("META_APP_SECRET"), {
          detail: oauthDetail("META_APP_ID", "META_APP_SECRET"),
          source: sourceOf("META_APP_ID"),
          optional: true,
        }),
        presence("google", "Google / YouTube app config present", has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET"), {
          detail: oauthDetail("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
          source: sourceOf("GOOGLE_CLIENT_ID"),
          optional: true,
        }),
        presence("tiktok", "TikTok app config present", has("TIKTOK_CLIENT_KEY") && has("TIKTOK_CLIENT_SECRET"), {
          detail: oauthDetail("TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"),
          source: sourceOf("TIKTOK_CLIENT_KEY"),
          optional: true,
        }),
        presence("x", "X app config present", has("X_CLIENT_ID") && has("X_CLIENT_SECRET"), {
          detail: oauthDetail("X_CLIENT_ID", "X_CLIENT_SECRET"),
          source: sourceOf("X_CLIENT_ID"),
          optional: true,
        }),
      ],
    },
    {
      title: "AI, billing & automation",
      description: "Content generation, Stripe billing, outbound webhooks, and the cron secret.",
      items: [
        presence("ai", "AI keys configured", has("OPENAI_API_KEY") || has("ANTHROPIC_API_KEY"), {
          detail: aiDetail(has("OPENAI_API_KEY"), has("ANTHROPIC_API_KEY"), sourceOf),
          source: sourceOf("ANTHROPIC_API_KEY") ?? sourceOf("OPENAI_API_KEY"),
          optional: true,
        }),
        presence("stripe", "Stripe keys configured", has("STRIPE_SECRET_KEY"), {
          detail: stripeDetail(has, sourceOf),
          source: sourceOf("STRIPE_SECRET_KEY"),
          optional: true,
        }),
        presence("webhook-secret", "Webhook secret present", has("STRIPE_WEBHOOK_SECRET") || has("PLATFORM_WEBHOOK_SIGNING_SECRET"), {
          detail: webhookSecretDetail(has),
          optional: true,
        }),
        presence("cron-secret", "Cron secret present", has("CRON_SECRET"), {
          detail: has("CRON_SECRET")
            ? `Set (${sourceOf("CRON_SECRET")}) — /api/cron/* require a Bearer token.`
            : "Set CRON_SECRET to protect the /api/cron/* endpoints.",
          source: sourceOf("CRON_SECRET"),
          optional: true,
        }),
      ],
    },
  ];

  const checklist = buildChecklist({
    configured,
    hasServiceRole,
    hasEncryption,
    anySecretInDb: ALL_SECRET_KEYS.some((k) => statuses[k]?.setInDb),
    dbReachable: dbItem.status === "healthy",
    storageReady: storageItem.status === "healthy",
    stripeWebhook: has("STRIPE_SECRET_KEY") && has("STRIPE_WEBHOOK_SECRET"),
    cron: has("CRON_SECRET"),
    appUrl: appOrigin(),
    anyOauth:
      (has("LINKEDIN_CLIENT_ID") && has("LINKEDIN_CLIENT_SECRET")) ||
      (has("META_APP_ID") && has("META_APP_SECRET")) ||
      (has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET")) ||
      (has("TIKTOK_CLIENT_KEY") && has("TIKTOK_CLIENT_SECRET")) ||
      (has("X_CLIENT_ID") && has("X_CLIENT_SECRET")),
  });

  const summary = sections
    .flatMap((s) => s.items)
    .reduce(
      (acc, item) => {
        if (item.status === "error") acc.errors += 1;
        else if (item.status === "missing" || item.status === "warn") acc.attention += 1;
        else acc.healthy += 1;
        return acc;
      },
      { healthy: 0, attention: 0, errors: 0 }
    );

  return { configured, sections, checklist, summary };
}

function aiDetail(
  hasOpenAI: boolean,
  hasAnthropic: boolean,
  sourceOf: (k: string) => "saved" | "env" | null
): string {
  if (!hasOpenAI && !hasAnthropic) return "No provider key — Content Studio runs in demo mode.";
  const parts: string[] = [];
  if (hasAnthropic) parts.push(`Anthropic (${sourceOf("ANTHROPIC_API_KEY")})`);
  if (hasOpenAI) parts.push(`OpenAI (${sourceOf("OPENAI_API_KEY")})`);
  return `Configured: ${parts.join(", ")}.`;
}

function stripeDetail(has: (k: string) => boolean, sourceOf: (k: string) => "saved" | "env" | null): string {
  if (!has("STRIPE_SECRET_KEY")) return "No secret key — billing runs in demo mode.";
  const bits = [`secret (${sourceOf("STRIPE_SECRET_KEY")})`];
  bits.push(has("STRIPE_WEBHOOK_SECRET") ? "webhook ✓" : "webhook ✗");
  bits.push(has("STRIPE_PRICE_PRO") ? "pro price ✓" : "pro price ✗");
  bits.push(has("STRIPE_PRICE_AGENCY") ? "agency price ✓" : "agency price ✗");
  return bits.join(" · ");
}

function webhookSecretDetail(has: (k: string) => boolean): string {
  const stripe = has("STRIPE_WEBHOOK_SECRET");
  const platform = has("PLATFORM_WEBHOOK_SIGNING_SECRET");
  if (!stripe && !platform) return "No webhook signing secret set (optional outbound + Stripe).";
  const bits: string[] = [];
  bits.push(stripe ? "Stripe webhook ✓" : "Stripe webhook ✗");
  bits.push(platform ? "Platform HMAC ✓" : "Platform HMAC ✗");
  return bits.join(" · ");
}

function buildChecklist(ctx: {
  configured: boolean;
  hasServiceRole: boolean;
  hasEncryption: boolean;
  anySecretInDb: boolean;
  dbReachable: boolean;
  storageReady: boolean;
  stripeWebhook: boolean;
  cron: boolean;
  appUrl: string;
  anyOauth: boolean;
}): ChecklistItem[] {
  const prodUrl = isProductionUrl(ctx.appUrl);
  return [
    {
      id: "vercel-envs",
      label: "Vercel environment variables set",
      status: ctx.hasServiceRole && ctx.hasEncryption ? "done" : "todo",
      detail: "Set server-only secrets (service role, TOKEN_ENCRYPTION_KEY, AI, Stripe, OAuth) in Vercel → Settings → Environment Variables.",
    },
    {
      id: "schema",
      label: "Supabase schema applied",
      status: ctx.dbReachable ? "done" : "todo",
      detail: ctx.dbReachable ? "Database reachable and core tables present." : "Run supabase/schema.sql against the project.",
    },
    {
      id: "buckets",
      label: "Storage buckets configured",
      status: ctx.storageReady ? "done" : ctx.hasServiceRole ? "todo" : "manual",
      detail: ctx.storageReady
        ? "All media buckets exist (created by the schema)."
        : "Re-run supabase/schema.sql; verify with the Storage test below.",
    },
    {
      id: "admin-secrets",
      label: "Admin secrets added",
      status: ctx.anySecretInDb ? "done" : ctx.hasServiceRole ? "todo" : "manual",
      detail: ctx.anySecretInDb
        ? "At least one key is stored in Platform Keys."
        : "Add API keys in /admin/secrets (or rely on env fallback).",
    },
    {
      id: "domain",
      label: "socialflowapp.com domain configured",
      status: prodUrl ? "done" : "todo",
      detail: prodUrl
        ? `App origin resolves to ${ctx.appUrl}.`
        : "Point the production domain at Vercel and set NEXT_PUBLIC_APP_URL to it.",
    },
    {
      id: "app-url",
      label: "NEXT_PUBLIC_APP_URL correct",
      status: prodUrl ? "done" : "todo",
      detail: prodUrl ? `Set to ${ctx.appUrl}.` : `Currently "${ctx.appUrl}" — set the public https origin for OAuth & Stripe return URLs.`,
    },
    {
      id: "stripe-webhook",
      label: "Stripe webhook configured",
      status: ctx.stripeWebhook ? "done" : "todo",
      detail: ctx.stripeWebhook
        ? "Secret key + webhook signing secret set."
        : `Add a Stripe webhook to ${ctx.appUrl}/api/stripe/webhook and store STRIPE_WEBHOOK_SECRET.`,
    },
    {
      id: "oauth-redirects",
      label: "OAuth redirect URLs configured",
      status: ctx.anyOauth && prodUrl ? "manual" : "todo",
      detail: `Register <origin>/api/oauth/<provider>/callback in each provider's dashboard. Verify with the OAuth test below.`,
    },
    {
      id: "cron",
      label: "Cron configured",
      status: ctx.cron ? "done" : "todo",
      detail: ctx.cron
        ? "CRON_SECRET set; vercel.json schedules the daily runners."
        : "Set CRON_SECRET; Vercel Cron (vercel.json) sends it automatically.",
    },
  ];
}
