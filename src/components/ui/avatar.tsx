import { cn } from "@/lib/utils";

export interface AvatarProps {
  initials: string;
  gradient?: string;
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-8 w-8 text-xs",
  default: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function Avatar({
  initials,
  gradient = "from-brand-500 to-coral-500",
  size = "default",
  className,
  ring = false,
}: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm",
        gradient,
        sizeMap[size],
        ring && "ring-2 ring-card",
        className
      )}
    >
      {initials}
    </span>
  );
}
