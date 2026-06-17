import "server-only";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Service-role Supabase client — server-only, bypasses RLS.
 *
 * Used by background work that runs WITHOUT a user session (e.g. the publishing
 * job runner triggered by cron). NEVER import this into client code and never
 * expose the service-role key. Returns `null` when not configured so callers
 * degrade to a safe no-op in demo/preview.
 */

/** True when both the Supabase URL and a service-role key are present. */
export function isAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Build a service-role client, or `null` when not configured. */
export function createAdminClient(): SupabaseClient | null {
  if (!isAdminConfigured()) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
