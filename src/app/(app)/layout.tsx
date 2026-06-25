import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionView } from "@/lib/db/session";
import { IMP_ACTIVE_COOKIE } from "@/lib/admin/impersonation";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionView();
  // Suspended accounts cannot use the app.
  if (session.status === "suspended") redirect("/suspended");

  const jar = await cookies();
  const impersonating = Boolean(jar.get(IMP_ACTIVE_COOKIE)?.value);

  return (
    <AppShell session={session} impersonating={impersonating}>
      {children}
    </AppShell>
  );
}
