"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncAnalyticsAction } from "@/app/actions/analytics";

/**
 * "Sync now" control for the analytics header. Pulls fresh metrics for connected
 * platforms and shows a transient result message.
 */
export function AnalyticsSyncButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleSync() {
    setMsg(null);
    startTransition(async () => {
      const res = await syncAnalyticsAction();
      if (res.ok) {
        setMsg(
          res.synced > 0
            ? `Synced ${res.synced} ${res.synced === 1 ? "source" : "sources"}`
            : res.message ?? "Nothing to sync"
        );
      } else {
        setMsg(res.error);
      }
      setTimeout(() => setMsg(null), 4000);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      {msg && <span className="hidden text-xs font-medium text-muted-foreground sm:inline">{msg}</span>}
      <Button variant="outline" onClick={handleSync} disabled={pending}>
        <RefreshCw className={`h-4 w-4${pending ? " animate-spin" : ""}`} />
        {pending ? "Syncing…" : "Sync now"}
      </Button>
    </span>
  );
}
