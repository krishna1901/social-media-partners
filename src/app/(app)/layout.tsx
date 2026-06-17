import { AppShell } from "@/components/layout/app-shell";
import { getSessionView } from "@/lib/db/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionView();
  return <AppShell session={session}>{children}</AppShell>;
}
