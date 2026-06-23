"use server";

import Stripe from "stripe";
import { randomUUID } from "crypto";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit";
import { getPlatformSecret } from "@/lib/platform/secrets";
import { resolveProvider, defaultModelFor } from "@/lib/ai/providers";
import { isStripeConfigured, isStripeWebhookConfigured } from "@/lib/billing/stripe";
import { isLinkedInConfigured } from "@/lib/integrations/linkedin";
import { isMetaConfigured } from "@/lib/integrations/meta";
import { isProviderConfigured } from "@/lib/integrations/scaffold";
import { appOrigin, EXPECTED_BUCKETS } from "@/lib/admin/health";

/**
 * Admin-only "safe connection tests" backing the buttons on `/admin/health`.
 *
 * Rules honored here:
 *  - Every action re-verifies super-admin (defense in depth — Server Actions are
 *    reachable by direct POST).
 *  - No secret value is ever returned, logged, or echoed.
 *  - No heavy / paid API calls. AI is a config-only check (calls cost money);
 *    Stripe makes a single free metadata read; the storage write is a tiny temp
 *    file that is immediately deleted.
 */

export interface HealthTestResult {
  ok: boolean;
  status: "pass" | "warn" | "fail";
  title: string;
  message: string;
  details?: string[];
}

// Accepts PromiseLike so it also works with Supabase/Stripe query builders
// (which are thenables, not real Promises).
function withTimeout<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error.";
}

/** Best-effort audit trail for which tests were run (never includes secrets). */
async function audit(actorId: string, actorEmail: string | null, test: string): Promise<void> {
  try {
    await logAdminAction({ actorId, actorEmail, action: "run_health_test", targetType: "health", targetId: test });
  } catch {
    // never block a test on audit failure
  }
}

/** Test: Supabase DB read. */
export async function testDatabaseReadAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "db_read");

  const client = createAdminClient() ?? (await createClient());
  try {
    const { error, count } = await withTimeout(
      client.from("profiles").select("id", { head: true, count: "exact" }),
      8000
    );
    if (error) {
      return { ok: false, status: "fail", title: "Supabase DB read", message: error.message };
    }
    return {
      ok: true,
      status: "pass",
      title: "Supabase DB read",
      message: "Read succeeded.",
      details: [typeof count === "number" ? `Visible profile rows: ${count}` : "Query returned without error."],
    };
  } catch (err) {
    return { ok: false, status: "fail", title: "Supabase DB read", message: errMessage(err) };
  }
}

/** Test: Supabase Storage permission via a tiny temporary file (write + delete). */
export async function testStorageAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "storage");

  const sb = createAdminClient();
  if (!sb) {
    return {
      ok: false,
      status: "warn",
      title: "Supabase Storage",
      message: "Set SUPABASE_SERVICE_ROLE_KEY to run the storage test.",
    };
  }

  const details: string[] = [];
  try {
    // 1) Dry check: list buckets and confirm the expected set exists.
    const { data: buckets, error: listErr } = await withTimeout(sb.storage.listBuckets(), 8000);
    if (listErr) {
      return { ok: false, status: "fail", title: "Supabase Storage", message: `List buckets failed: ${listErr.message}` };
    }
    const ids = new Set((buckets ?? []).map((b) => b.id));
    const missing = EXPECTED_BUCKETS.filter((b) => !ids.has(b));
    details.push(missing.length ? `Missing bucket(s): ${missing.join(", ")}` : `All ${EXPECTED_BUCKETS.length} buckets present.`);

    // 2) Permission check: write + delete a tiny temp file in the private `zips` bucket.
    const path = `__healthcheck/${randomUUID()}.txt`;
    const { error: upErr } = await withTimeout(
      sb.storage.from("zips").upload(path, Buffer.from("socialflow healthcheck"), {
        contentType: "text/plain",
        upsert: true,
      }),
      8000
    );
    if (upErr) {
      details.push("Temp-file write failed.");
      return {
        ok: false,
        status: missing.length ? "fail" : "warn",
        title: "Supabase Storage",
        message: `Write check failed: ${upErr.message}`,
        details,
      };
    }
    await sb.storage.from("zips").remove([path]).catch(() => undefined);
    details.push("Wrote + deleted a 22-byte temp file in 'zips'.");

    return {
      ok: missing.length === 0,
      status: missing.length ? "warn" : "pass",
      title: "Supabase Storage",
      message: missing.length ? "Reachable, but some buckets are missing." : "Storage reachable and writable.",
      details,
    };
  } catch (err) {
    return { ok: false, status: "fail", title: "Supabase Storage", message: errMessage(err), details };
  }
}

/** Test: AI provider configured (config-only — no paid API call). */
export async function testAIProviderAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "ai_provider");

  const provider = await resolveProvider();
  if (!provider) {
    return {
      ok: false,
      status: "warn",
      title: "AI provider",
      message: "No AI key configured — Content Studio runs in demo mode.",
      details: ["Add an OpenAI or Anthropic key in Platform Keys."],
    };
  }
  const model = await defaultModelFor(provider);
  return {
    ok: true,
    status: "pass",
    title: "AI provider",
    message: `Configured — generations route to ${provider}.`,
    details: [`Default model: ${model}`, "Config-only check (no API call made)."],
  };
}

/** Test: Stripe configured — single free metadata read to validate the key. */
export async function testStripeAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "stripe");

  if (!(await isStripeConfigured())) {
    return {
      ok: false,
      status: "warn",
      title: "Stripe",
      message: "No Stripe secret key — billing runs in demo mode.",
    };
  }
  const key = await getPlatformSecret("STRIPE_SECRET_KEY");
  if (!key) {
    return { ok: false, status: "warn", title: "Stripe", message: "Stripe secret key not resolvable." };
  }
  const mode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unknown";
  const webhookReady = await isStripeWebhookConfigured();

  try {
    const stripe = new Stripe(key, { maxNetworkRetries: 0, timeout: 8000 });
    await withTimeout(stripe.products.list({ limit: 1 }), 9000);
    return {
      ok: true,
      status: webhookReady ? "pass" : "warn",
      title: "Stripe",
      message: "Stripe API reachable — secret key is valid.",
      details: [
        `Key mode: ${mode}`,
        webhookReady ? "Webhook signing secret set." : "Webhook signing secret not set.",
      ],
    };
  } catch (err) {
    return {
      ok: false,
      status: "fail",
      title: "Stripe",
      message: `Could not reach Stripe: ${errMessage(err)}`,
      details: [`Key mode: ${mode}`],
    };
  }
}

/** Test: OAuth redirect URLs configured (computes the public callback URLs). */
export async function testOAuthRedirectsAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "oauth_redirects");

  const base = appOrigin();
  let validOrigin = false;
  try {
    const u = new URL(base);
    validOrigin = u.protocol === "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1";
  } catch {
    validOrigin = false;
  }

  const [linkedin, meta, youtube, tiktok, x] = await Promise.all([
    isLinkedInConfigured(),
    isMetaConfigured(),
    isProviderConfigured("youtube"),
    isProviderConfigured("tiktok"),
    isProviderConfigured("x"),
  ]);

  const providers: { id: string; configured: boolean }[] = [
    { id: "linkedin", configured: linkedin },
    { id: "meta", configured: meta },
    { id: "youtube", configured: youtube },
    { id: "tiktok", configured: tiktok },
    { id: "x", configured: x },
  ];

  const details = providers.map(
    (p) => `${p.configured ? "✓" : "·"} ${base}/api/oauth/${p.id}/callback${p.configured ? "" : "  (app not configured)"}`
  );

  if (!validOrigin) {
    return {
      ok: false,
      status: "warn",
      title: "OAuth redirect URLs",
      message: `App origin is "${base}". Set NEXT_PUBLIC_APP_URL to your https domain so callbacks match.`,
      details,
    };
  }
  return {
    ok: true,
    status: "pass",
    title: "OAuth redirect URLs",
    message: "Register these exact callback URLs in each provider's dashboard.",
    details,
  };
}

/** Test: webhook URL format (format-only; never POSTs to the URL). */
export async function testWebhookUrlAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "webhook_url");

  const base = appOrigin();
  const stripeWebhook = `${base}/api/stripe/webhook`;
  const details = [`Stripe webhook endpoint: ${stripeWebhook}`];

  const outbound = await getPlatformSecret("PLATFORM_WEBHOOK_URL");
  const signing = await getPlatformSecret("PLATFORM_WEBHOOK_SIGNING_SECRET");

  if (!outbound) {
    details.push("Outbound platform webhook: not set (optional).");
    return {
      ok: true,
      status: "pass",
      title: "Webhook URL format",
      message: "No outbound webhook set (optional). Stripe endpoint shown for registration.",
      details,
    };
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(outbound);
  } catch {
    parsed = null;
  }
  const okFormat = Boolean(parsed && (parsed.protocol === "https:" || parsed.protocol === "http:"));
  details.push(`Outbound webhook host: ${parsed ? parsed.host : "(invalid)"}`);
  details.push(signing ? "HMAC signing secret set (x-sf-signature)." : "No HMAC signing secret (unsigned).");

  return {
    ok: okFormat,
    status: okFormat ? "pass" : "fail",
    title: "Webhook URL format",
    message: okFormat ? "Outbound webhook URL is a valid absolute URL." : "PLATFORM_WEBHOOK_URL is not a valid http(s) URL.",
    details,
  };
}

/** Test: cron secret configured. */
export async function testCronSecretAction(): Promise<HealthTestResult> {
  const admin = await requireSuperAdmin();
  await audit(admin.userId, admin.email, "cron_secret");

  const secret = await getPlatformSecret("CRON_SECRET");
  if (!secret) {
    return {
      ok: false,
      status: "warn",
      title: "Cron secret",
      message: "CRON_SECRET not set — /api/cron/* endpoints are an open demo no-op.",
      details: ["Set CRON_SECRET so the cron endpoints require a Bearer token."],
    };
  }
  return {
    ok: true,
    status: "pass",
    title: "Cron secret",
    message: "CRON_SECRET configured — /api/cron/* require authorization.",
    details: [
      "Vercel Cron sends it as Authorization: Bearer automatically.",
      "vercel.json schedules /api/cron/publish and /api/cron/maintenance daily.",
    ],
  };
}
