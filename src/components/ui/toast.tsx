"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free toast layer. The app standardises success /
 * error / info feedback through `useToast()` so buttons across the product give
 * consistent, premium-feeling notices instead of silently doing nothing.
 */

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

let counter = 0;

const variantStyles: Record<
  ToastVariant,
  { icon: ReactNode; iconWrap: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    iconWrap: "bg-emerald-100 text-emerald-600",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    iconWrap: "bg-destructive/15 text-destructive",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    iconWrap: "bg-brand-100 text-brand-600",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++counter;
      setToasts((current) => [
        ...current,
        { id, variant: "info", ...input },
      ]);
      // Auto-dismiss; kept short so notices never pile up.
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((t) => {
          const style = variantStyles[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-elevated animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  style.iconWrap
                )}
              >
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-m-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
