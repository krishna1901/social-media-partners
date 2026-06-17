import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchPlaceholder?: string;
  /** Filter controls (selects, segmented, etc.) rendered next to search */
  children?: React.ReactNode;
  /** Right-aligned actions */
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({ searchPlaceholder, children, actions, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchPlaceholder && (
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={searchPlaceholder} className="h-9 pl-9" />
          </div>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
