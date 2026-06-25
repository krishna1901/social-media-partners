import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Lightweight auth check (no workspace bootstrap) for the public shell. */
async function isLoggedIn(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isLoggedIn();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <SiteHeader loggedIn={loggedIn} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
