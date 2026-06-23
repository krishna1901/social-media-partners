"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPlatformSecretAction, clearPlatformSecretAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/admin/badges";

export function SecretEditor({
  secretKey,
  label,
  isSecret,
  status,
  hint,
}: {
  secretKey: string;
  label: string;
  isSecret: boolean;
  status: { setInDb: boolean; setInEnv: boolean };
  hint?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const source = status.setInDb ? (
    <Pill tone="green">saved</Pill>
  ) : status.setInEnv ? (
    <Pill tone="brand">env</Pill>
  ) : (
    <Pill tone="muted">unset</Pill>
  );

  function save() {
    if (!value.trim()) return;
    setError(null);
    start(async () => {
      const r = await setPlatformSecretAction(secretKey, value);
      if (!r.ok) setError(r.error ?? "Failed to save.");
      else {
        setValue("");
        router.refresh();
      }
    });
  }

  function clear() {
    setError(null);
    start(async () => {
      const r = await clearPlatformSecretAction(secretKey);
      if (!r.ok) setError(r.error ?? "Failed to clear.");
      else router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{secretKey}</p>
        </div>
        {source}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type={isSecret ? "password" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={status.setInDb ? "Enter a new value to replace" : "Enter value"}
          autoComplete="off"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button variant="outline" disabled={pending || !value.trim()} onClick={save}>Save</Button>
        {status.setInDb && (
          <Button variant="ghost" disabled={pending} onClick={clear}>Clear</Button>
        )}
      </div>
      {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
