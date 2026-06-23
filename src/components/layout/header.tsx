"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Plus,
  ChevronDown,
  Sparkles,
  Lightbulb,
  UploadCloud,
  PenSquare,
  Check,
} from "lucide-react";
import { CommandBar } from "@/components/ui/command-bar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { notifications as demoNotifications } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Notification = (typeof demoNotifications)[number];

const createOptions = [
  { title: "New post", desc: "Compose & schedule", href: "/posts/new", icon: PenSquare },
  { title: "Generate content", desc: "AI content tools", href: "/content-studio", icon: Sparkles },
  { title: "New idea", desc: "Add to backlog", href: "/ideas", icon: Lightbulb },
  { title: "Upload media", desc: "Add assets", href: "/media", icon: UploadCloud },
];

const notifKindColor: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-600",
  inbox: "bg-sky-100 text-sky-600",
  trend: "bg-amber-100 text-amber-600",
  ai: "bg-brand-100 text-brand-600",
};

export function Header({ onMenuClick, live }: { onMenuClick?: () => void; live?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // Live accounts have no notification feed yet → empty; demo shows the showcase.
  // Held in state so "Mark all read" can update the unread badge in place.
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    live ? [] : demoNotifications.map((n) => ({ ...n }))
  );
  const unread = notifications.filter((n) => n.unread).length;

  function markAllRead() {
    if (unread === 0) return;
    setNotifications((current) => current.map((n) => ({ ...n, unread: false })));
    toast({
      variant: "success",
      title: "All caught up",
      description: `Marked ${unread} ${unread === 1 ? "notification" : "notifications"} as read.`,
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-card/70 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <CommandBar className="md:w-72" />
      </div>

      <div className="flex items-center gap-2">
        {/* Quick create */}
        <div className="relative">
          <Button
            variant="gradient"
            onClick={() => {
              setCreateOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="h-9 rounded-full px-3 font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </Button>
          {createOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCreateOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-elevated animate-in fade-in zoom-in-95 duration-150">
                {createOptions.map((o) => (
                  <button
                    key={o.href}
                    onClick={() => {
                      setCreateOpen(false);
                      router.push(o.href);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <o.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">{o.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{o.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setCreateOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white ring-2 ring-card">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-elevated animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-medium text-brand-600 transition-colors hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {unread === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
                      <p className="mt-1 text-xs text-muted-foreground">New activity will show up here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50", n.unread && "bg-brand-50/30")}>
                        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", notifKindColor[n.kind] ?? "bg-muted text-muted-foreground")}>
                          {n.kind === "success" ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/inbox" onClick={() => setNotifOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-muted/50">
                  Open inbox
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
