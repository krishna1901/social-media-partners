import { NextResponse, type NextRequest } from "next/server";
import { getDbContext, isLive } from "@/lib/db/context";
import { storeConnection } from "@/lib/db/social-tokens";
import { isScaffoldId, exchangeCode, getProvider } from "@/lib/integrations/scaffold";

/**
 * Generic OAuth callback for scaffolded providers (YouTube/TikTok/X) — Phase 3G.
 * Verifies state (+ PKCE verifier), exchanges the code, and stores an encrypted
 * connection scoped to the active workspace.
 */
export const dynamic = "force-dynamic";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!isScaffoldId(provider)) {
    return NextResponse.redirect(`${appUrl()}/integrations?error=unknown_provider`);
  }

  const fail = (reason: string): NextResponse => {
    const res = NextResponse.redirect(`${appUrl()}/integrations?error=${reason}`);
    res.cookies.set(`oauth_state_${provider}`, "", { maxAge: 0, path: "/" });
    res.cookies.set(`oauth_verifier_${provider}`, "", { maxAge: 0, path: "/" });
    return res;
  };

  const sp = request.nextUrl.searchParams;
  const code = sp.get("code");
  const state = sp.get("state");
  const oauthError = sp.get("error");

  if (oauthError) return fail(oauthError);
  if (!code || !state) return fail("missing_code");

  const cookieState = request.cookies.get(`oauth_state_${provider}`)?.value;
  if (!cookieState || cookieState !== state) return fail("state_mismatch");

  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return NextResponse.redirect(`${appUrl()}/login?redirectedFrom=/integrations`);
  }

  try {
    const verifier = getProvider(provider).pkce
      ? request.cookies.get(`oauth_verifier_${provider}`)?.value
      : undefined;
    const token = await exchangeCode(provider, code, verifier);
    const expiresAt = token.expiresIn
      ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
      : null;

    await storeConnection(ctx.supabase, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      platform: provider,
      accountName: getProvider(provider).label,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt,
    });

    const res = NextResponse.redirect(`${appUrl()}/integrations?connected=${provider}`);
    res.cookies.set(`oauth_state_${provider}`, "", { maxAge: 0, path: "/" });
    res.cookies.set(`oauth_verifier_${provider}`, "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return fail(`${provider}_connect_failed`);
  }
}
