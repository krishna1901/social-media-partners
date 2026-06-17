import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getDbContext, isLive } from "@/lib/db/context";
import { isLinkedInConfigured, buildAuthUrl } from "@/lib/integrations/linkedin";
import { isEncryptionConfigured } from "@/lib/security/crypto";

/**
 * Begin the LinkedIn OAuth flow (Phase 3C).
 *
 * Requires an authenticated user. Generates a CSRF `state`, stores it in an
 * httpOnly cookie, and redirects to LinkedIn's consent screen. Redirects back to
 * /integrations with an `error` query when prerequisites are missing.
 */
export const dynamic = "force-dynamic";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function GET(_request: NextRequest) {
  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return NextResponse.redirect(`${appUrl()}/login?redirectedFrom=/integrations`);
  }
  if (!isLinkedInConfigured()) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=linkedin_not_configured`);
  }
  if (!isEncryptionConfigured()) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=encryption_not_configured`);
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("li_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  return res;
}
