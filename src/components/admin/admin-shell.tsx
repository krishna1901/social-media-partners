"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { adminNav } from "@/lib/admin/nav";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-500/40 ring-1 ring-white/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-white">
            Admin <span className="text-brand-400">Panel</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">SocialFlow AI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide px-3 py-2">
        {adminNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-brand-500/25 to-coral-500/10 text-white ring-1 ring-inset ring-white/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", active ? "text-brand-400" : "text-white/50")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to app
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-300 transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminShell({ email, children }: { email: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block">
        <SidebarBody pathname={pathname} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-in slide-in-from-left duration-200">
            <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-card/70 px-4 backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Master Admin
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1280px] animate-rise p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
