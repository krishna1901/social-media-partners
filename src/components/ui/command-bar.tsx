"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, Plus, Sparkles, Lightbulb, UploadCloud, CornerDownLeft } from "lucide-react";
import { allNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

const quickCreate = [
  { title: "New post", href: "/posts/new", icon: Plus },
  { title: "Generate content", href: "/content-studio", icon: Sparkles },
  { title: "New idea", href: "/ideas", icon: Lightbulb },
  { title: "Upload media", href: "/media", icon: UploadCloud },
];

export function CommandBar({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const q = query.trim().toLowerCase();
  const navResults = allNavItems.filter((i) => i.title.toLowerCase().includes(q));
  const createResults = quickCreate.filter((i) => i.title.toLowerCase().includes(q));
  const noResults = navResults.length === 0 && createResults.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex h-9 items-center gap-2 rounded-full border border-border bg-muted/60 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:bg-muted",
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search or jump to…</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline-flex">
          ⌘K
        </kbd>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setOpen(false)} />
            <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages and actions…"
                  className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">ESC</kbd>
              </div>

              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin p-2">
                {noResults && (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{query}”</p>
                )}

                {createResults.length > 0 && (
                  <div className="mb-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quick create</p>
                    {createResults.map((i) => (
                      <button
                        key={i.href}
                        onClick={() => go(i.href)}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <i.icon className="h-4 w-4" />
                        </span>
                        {i.title}
                        <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {navResults.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Go to</p>
                    {navResults.map((i) => (
                      <button
                        key={i.href}
                        onClick={() => go(i.href)}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                          <i.icon className="h-4 w-4" />
                        </span>
                        {i.title}
                        <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
