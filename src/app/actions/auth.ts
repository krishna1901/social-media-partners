"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureUserBootstrapped } from "@/lib/db/workspaces";

export type AuthState = { error: string | null };

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  // Demo/preview mode: no real auth — just enter the app.
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  if (data.user) await ensureUserBootstrapped(supabase, data.user);
  redirect("/dashboard");
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, we get a session immediately.
  if (data.session && data.user) {
    await ensureUserBootstrapped(supabase, data.user);
    redirect("/dashboard");
  }
  redirect("/login?message=check-email");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
