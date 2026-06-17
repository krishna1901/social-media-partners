/**
 * Supabase connection + config guard.
 *
 * The app is **live-by-default**: it connects to the live "social" project using
 * the baked browser-public URL + anon key below (the anon key already ships in
 * the client bundle via NEXT_PUBLIC_, so committing it is safe). Override either
 * value with env vars to point at a different project. Set
 * `NEXT_PUBLIC_DEMO_MODE=true` to force demo/preview mode — no auth enforcement,
 * sample data — which keeps `next build` / previews working with no secrets.
 *
 * NEVER bake server-only secrets (service-role key, API keys, etc.) here — those
 * stay in environment variables.
 */

const DEFAULT_SUPABASE_URL = "https://ttffcglpaurhlcwfeqqz.supabase.co";
// Public anon (publishable) key for the "social" project — safe to ship to browsers.
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0ZmZjZ2xwYXVyaGxjd2ZlcXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTQ4ODksImV4cCI6MjA5NzI3MDg4OX0.L1pbJOxxbhkqxfSlkRkNRDQc-Phb9MORptHrVS9oQn4";

/** Live Supabase URL — env override, else the baked default. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;

/** Live Supabase anon/publishable key — env override, else the baked default. */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

/**
 * True when the app should run against the live database (auth enforced, real
 * data). Defaults to true via the baked config; `NEXT_PUBLIC_DEMO_MODE=true`
 * forces demo/preview mode.
 */
export function isSupabaseConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return false;
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      !SUPABASE_URL.includes("placeholder") &&
      !SUPABASE_ANON_KEY.includes("placeholder")
  );
}
