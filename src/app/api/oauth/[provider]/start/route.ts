import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getDbContext, isLive } from "@/lib/db/context";
import { isEncryptionConfigured } from "@/lib/security/crypto";
import {
  isScaffoldId,
  isProviderConfigured,
  buildAuthUrl,
  pkceChallenge,
  getProvider,
} from "@/lib/integrations/scaffold";

/**
 * Generic OAuth start for scaffolded providers (YouTube/TikTok/X) — Phase 3G.
 * LinkedIn/Meta use their dedicated static routes (which take precedence).
 */
export const dynamic = "force-dynamic";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!isScaffoldId(provider)) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=unknown_provider`);
  }

  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return NextResponse.redirect(`${appUrl()}/login?redirectedFrom=/integrations`);
  }
  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=${provider}_not_configured`);
  }
  if (!isEncryptionConfigured()) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=encryption_not_configured`);
  }

  const state = randomBytes(16).toString("hex");
  const usesPkce = getProvider(provider).pkce;
  const verifier = usesPkce ? randomBytes(32).toString("hex") : null;
  const challenge = verifier ? pkceChallenge(verifier) : undefined;

  const res = NextResponse.redirect(buildAuthUrl(provider, state, challenge));
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set(`oauth_state_${provider}`, state, cookieOpts);
  if (verifier) res.cookies.set(`oauth_verifier_${provider}`, verifier, cookieOpts);
  return res;
}
