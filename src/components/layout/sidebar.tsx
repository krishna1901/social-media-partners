"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, Sparkles, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { workspaces as demoWorkspaces, currentUser } from "@/lib/demo-data";
import { Avatar } from "@/components/ui/avatar";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { SessionView } from "@/lib/db/session";

/** Two-letter initials from a display name. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function WorkspaceSwitcher({ session }: { session: SessionView }) {
  const [open, setOpen] = useState(false);

  const live = session.live && Boolean(session.workspaceName);
  const active = live
    ? {
        id: "active",
        name: session.workspaceName as string,
        plan: session.plan ?? "starter",
        initials: initialsFrom(session.workspaceName as string),
        color: "from-brand-500 to-coral-500",
        active: true,
      }
    : demoWorkspaces.find((w) => w.active) ?? demoWorkspaces[0];
  const list = live ? [active] : demoWorkspaces;

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
          <p className="text-[11px] capitalize text-white/50">{active.plan} workspace</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/10 bg-sidebar-accent p-1 shadow-2xl">
            {list.map((w) => (
              <button
                key={w.id}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-white/10"
              >
                <Avatar initials={w.initials} gradient={w.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{w.name}</p>
                  <p className="text-[11px] capitalize text-white/50">{w.plan}</p>
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

function UserWidget({ session }: { session: SessionView }) {
  const [open, setOpen] = useState(false);
  const name = session.live ? session.userName ?? "Your account" : currentUser.name;
  const email = session.live ? session.userEmail ?? "" : currentUser.email;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
      >
        <Avatar initials={initialsFrom(name)} gradient="from-brand-500 to-coral-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="truncate text-[11px] text-white/50">{email}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-xl border border-white/10 bg-sidebar-accent p-1 shadow-2xl">
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/80 hover:bg-white/10">
              <User className="h-4 w-4" /> Profile
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-white/80 hover:bg-white/10">
              <SettingsIcon className="h-4 w-4" /> Settings
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-300 hover:bg-white/10">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar({
  className,
  onNavigate,
  session,
}: {
  className?: string;
  onNavigate?: () => void;
  session: SessionView;
}) {
  const pathname = usePathname();

  return (
    <aside className={cn("relative flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
      {/* Ambient radial glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-56 rounded-full bg-brand-500/20 blur-[80px]" />
      {/* Brand */}
      <div className="relative flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-500/40 ring-1 ring-white/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-white">
            SocialFlow <span className="text-brand-400">AI</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Command Center</p>
        </div>
      </div>

      <WorkspaceSwitcher session={session} />

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
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-brand-500/25 to-coral-500/10 text-white shadow-sm shadow-brand-500/10 ring-1 ring-inset ring-white/10"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-400 to-coral-500 shadow-[0_0_12px] shadow-brand-500/50" />
                  )}
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-coral-600 p-4 shadow-lg shadow-brand-500/25 ring-1 ring-white/15">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
          <p className="relative text-sm font-bold text-white">Upgrade to Agency</p>
          <p className="relative mt-0.5 text-[11px] leading-relaxed text-white/85">Unlimited workspaces, AI credits &amp; team seats.</p>
          <Link href="/billing" onClick={onNavigate} className="relative mt-3 block w-full rounded-lg bg-white py-1.5 text-center text-xs font-bold text-brand-700 shadow-sm transition-all hover:-translate-y-px hover:shadow-md">
            View plans
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <UserWidget session={session} />
      </div>
    </aside>
  );
}
