import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Card shell for charts & rich widgets — consistent header / body / footer. */
export function ChartCard({ title, subtitle, action, children, footer, className, bodyClassName }: ChartCardProps) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">{footer}</footer>}
    </section>
  );
}
