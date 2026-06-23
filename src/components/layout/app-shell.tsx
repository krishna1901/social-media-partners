"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/motion/page-transition";
import { ToastProvider } from "@/components/ui/toast";
import { stopImpersonationAction } from "@/app/actions/admin";
import type { SessionView } from "@/lib/db/session";

export function AppShell({
  children,
  session,
  impersonating = false,
}: {
  children: React.ReactNode;
  session: SessionView;
  impersonating?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {impersonating && (
        <div className="flex shrink-0 items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white">
          <span>
            Viewing as {session.userName ?? session.userEmail ?? "user"} — admin impersonation
          </span>
          <form action={stopImpersonationAction}>
            <button type="submit" className="rounded bg-white/20 px-2 py-0.5 transition-colors hover:bg-white/30">
              Exit
            </button>
          </form>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar className="hidden lg:flex" session={session} />

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 animate-in slide-in-from-left duration-200">
              <Sidebar onNavigate={() => setMobileOpen(false)} session={session} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setMobileOpen(true)} live={session.live} />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <PageTransition className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}
