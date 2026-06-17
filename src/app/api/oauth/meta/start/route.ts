import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getDbContext, isLive } from "@/lib/db/context";
import { isMetaConfigured, buildAuthUrl } from "@/lib/integrations/meta";
import { isEncryptionConfigured } from "@/lib/security/crypto";

/**
 * Begin the Meta (Facebook/Instagram) OAuth flow (Phase 3D). Requires an
 * authenticated user; stores a CSRF `state` cookie and redirects to Facebook.
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
  if (!isMetaConfigured()) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=meta_not_configured`);
  }
  if (!isEncryptionConfigured()) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=encryption_not_configured`);
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
