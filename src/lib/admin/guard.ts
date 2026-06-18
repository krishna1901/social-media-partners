import "server-only";
import { redirect } from "next/navigation";
import { getDbContext, isLive } from "@/lib/db/context";

export interface AdminIdentity {
  userId: string;
  email: string | null;
}

/**
 * Gate a server component / action to the platform super-admin. Redirects
 * unauthenticated users to login and non-admins to the app. Returns the admin's
 * identity (for audit logging) on success.
 */
export async function requireSuperAdmin(): Promise<AdminIdentity> {
  const ctx = await getDbContext();
  if (!isLive(ctx)) redirect("/login?redirectedFrom=/admin");

  const { data } = await ctx.supabase
    .from("profiles")
    .select("email, role")
    .eq("id", ctx.userId)
    .maybeSingle();

  if ((data?.role as string | undefined) !== "super_admin") redirect("/dashboard");

  return { userId: ctx.userId, email: (data?.email as string | null) ?? null };
}
