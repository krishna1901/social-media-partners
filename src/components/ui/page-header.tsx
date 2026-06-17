import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, switchers, etc.) */
  actions?: React.ReactNode;
  /** Small overline / breadcrumb-style label above the title */
  eyebrow?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, eyebrow, icon, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-sm shadow-brand-500/20">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
