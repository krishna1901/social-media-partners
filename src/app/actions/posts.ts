"use server";

import { createClient } from "@/lib/supabase/server";

export async function createPost(data: Record<string, unknown>) {
  const supabase = await createClient();
  // Simple stub for now
  const { data: post, error } = await supabase.from("posts").insert([data]).select().single();
  if (error) {
    console.error("Error creating post:", error);
    return null;
  }
  return post;
}
