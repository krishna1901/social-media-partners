"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, Sparkles, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { workspaces, currentUser } from "@/lib/demo-data";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const active = workspaces.find((w) => w.active) ?? workspaces[0];

  return (
    <div className="relative px-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition-colors hover:bg-white/10"
      >
        <Avatar initials={active.initials} gradient={active.color} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{active.name}</p>
          <p className="text-[11px] text-white/50">{active.plan} workspace</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#1a2030] p-1 shadow-2xl">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-white/10"
              >
                <Avatar initials={w.initials} gradient={w.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{w.name}</p>
                  <p className="text-[11px] text-white/50">{w.plan}</p>
                </div>
                {w.active && <Check className="h-4 w-4 text-brand-400" />}
              </button>
            ))}
            <div className="mt-1 border-t border-white/10 p-1">
              <button className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-white/70 hover:bg-white/10">
                + Create new workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
      >
        <Avatar initials={currentUser.initials} gradient="from-brand-500 to-coral-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{currentUser.name}</p>
          <p className="truncate text-[11px] text-white/50">{currentUser.email}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-xl border border-white/10 bg-[#1a2030] p-1 shadow-2xl">
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/80 hover:bg-white/10">
              <User className="h-4 w-4" /> Profile
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/80 hover:bg-white/10">
              <SettingsIcon className="h-4 w-4" /> Settings
            </Link>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-300 hover:bg-white/10">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-white">
            SocialFlow <span className="text-brand-400">AI</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Command Center</p>
        </div>
      </div>

      <WorkspaceSwitcher />

      {/* Navigation */}
      <nav className="mt-5 flex-1 space-y-6 overflow-y-auto scrollbar-hide px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">{group.label}</p>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />}
                  <item.icon className={cn("h-[18px] w-[18px]", active ? "text-brand-400" : "text-white/50 group-hover:text-white/80")} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Upgrade card */}
      <div className="px-3 pb-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-coral-600 p-4 shadow-lg">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />
          <p className="text-sm font-bold text-white">Upgrade to Agency</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/80">Unlimited workspaces, AI credits &amp; team seats.</p>
          <button className="mt-3 w-full rounded-lg bg-white/95 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-white">
            View plans
          </button>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <UserWidget />
      </div>
    </aside>
  );
}
