/**
 * Phase 2 — config guard.
 *
 * The app runs in two modes:
 *   • "configured"  → real Supabase env present → auth is enforced and the data
 *                     layer reads/writes the live database.
 *   • "demo/preview" → no real env (placeholder values) → no auth enforcement and
 *                     the data layer serves the Phase-1 demo data. This keeps the
 *                     Vercel preview + `next build` working with no secrets.
 *
 * Detection is intentionally conservative: any missing/placeholder value ⇒ demo.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("placeholder") &&
      !key.includes("placeholder")
  );
}
