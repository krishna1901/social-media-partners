"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Client wrapper around next-themes so the server root layout can stay a server
 * component. Applies `class="dark"` on <html>, which the `@custom-variant dark`
 * in globals.css keys off. Persists choice to localStorage and respects the OS
 * preference by default.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
