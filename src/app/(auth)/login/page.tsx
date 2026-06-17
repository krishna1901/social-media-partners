"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = { error: null };

export default function LoginPage() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your SocialFlow AI workspace.</p>

      <form action={action} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" className="h-10" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{state.error}</p>
        )}

        <Button type="submit" variant="gradient" disabled={pending} className="h-10 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
      <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
        Preview/demo mode signs you in without credentials when Supabase isn&apos;t configured.
      </p>
    </div>
  );
}
