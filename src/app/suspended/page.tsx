import { ShieldAlert } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Account suspended · SocialFlow AI",
  robots: { index: false, follow: false },
};

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Account suspended</h1>
        <p className="mt-2 text-muted-foreground">
          Your account has been suspended. If you believe this is a mistake, contact{" "}
          <a href="mailto:support@socialflowapp.com" className="font-medium text-brand-600 hover:underline">
            support@socialflowapp.com
          </a>
          .
        </p>
        <form action={signOutAction} className="mt-6">
          <Button variant="outline" className="rounded-full">Sign out</Button>
        </form>
      </div>
    </div>
  );
}
