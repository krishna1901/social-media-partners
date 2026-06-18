import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionView } from "@/lib/db/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionView();
  // Suspended accounts cannot use the app.
  if (session.status === "suspended") redirect("/suspended");
  return <AppShell session={session}>{children}</AppShell>;
}
