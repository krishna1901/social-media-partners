"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light/dark toggle. Renders both icons and lets CSS show the right one based on
 * the `.dark` class next-themes sets on <html> — so there is no hydration gate
 * and no flash. `resolvedTheme` is only read at click time (always defined by
 * then).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme((resolvedTheme ?? "light") === "dark" ? "light" : "dark")}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
