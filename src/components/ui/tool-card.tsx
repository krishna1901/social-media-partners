"use client";

import { ArrowRight } from "lucide-react";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  name: string;
  desc: string;
  icon: string;
  color: string;
  tag?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ToolCard({ name, desc, icon, color, tag, selected, onClick, className }: ToolCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-brand-400 ring-2 ring-brand-200" : "border-border hover:border-brand-200",
        className
      )}
    >
      {tag && (
        <span className="absolute right-3 top-3 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600">
          {tag}
        </span>
      )}
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", color)}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
        Open tool <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
