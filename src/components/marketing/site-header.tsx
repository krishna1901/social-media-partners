"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const links = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            SocialFlow <span className="text-brand-500">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {loggedIn ? (
            <Link href="/dashboard">
              <Button variant="gradient" className="rounded-full">Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="gradient" className="rounded-full">Get started free</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {loggedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <Button variant="gradient" className="w-full rounded-full">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button variant="gradient" className="w-full rounded-full">Get started free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
