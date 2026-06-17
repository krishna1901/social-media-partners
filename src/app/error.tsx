"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Catches uncaught render/runtime errors and offers a
 * recovery path instead of a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability; replace with a real logger in production.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. You can try again — if it keeps happening, refresh the page.
        </p>
      </div>
      <Button variant="gradient" onClick={reset}>
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </main>
  );
}
