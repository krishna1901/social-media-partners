import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-soft">
        <Compass className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "gradient" }))}>
        Back to dashboard
      </Link>
    </main>
  );
}
