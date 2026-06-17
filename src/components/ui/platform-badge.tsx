import { platformMeta, type Platform } from "@/lib/demo-data";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { cn } from "@/lib/utils";

export function PlatformBadge({
  platform,
  showLabel = true,
  className,
}: {
  platform: Platform;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = platformMeta[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.tint,
        meta.text,
        className
      )}
    >
      <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
      {showLabel && meta.label}
    </span>
  );
}

/** Icon-only chip in a soft tile — for compact stacks of platforms. */
export function PlatformChip({ platform, className }: { platform: Platform; className?: string }) {
  const meta = platformMeta[platform];
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-lg border bg-card",
        meta.tint,
        meta.text,
        className
      )}
      title={meta.label}
    >
      <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
    </span>
  );
}

/** Overlapping stack of platform chips (e.g. cross-posted content). */
export function PlatformStack({ platforms, className }: { platforms: Platform[]; className?: string }) {
  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {platforms.map((p) => (
        <PlatformChip key={p} platform={p} className="ring-2 ring-card" />
      ))}
    </div>
  );
}
