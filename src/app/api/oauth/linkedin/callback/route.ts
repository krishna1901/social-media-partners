import { NextResponse, type NextRequest } from "next/server";
import { getDbContext, isLive } from "@/lib/db/context";
import { exchangeCode, fetchProfile } from "@/lib/integrations/linkedin";
import { storeConnection } from "@/lib/db/social-tokens";

/**
 * LinkedIn OAuth callback (Phase 3C).
 *
 * Verifies the CSRF `state`, exchanges the code for a token, fetches the member
 * profile, and stores an (encrypted) connection scoped to the active workspace.
 * Always redirects back to /integrations with a `connected` or `error` query.
 */
export const dynamic = "force-dynamic";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function fail(reason: string): NextResponse {
  const res = NextResponse.redirect(`${appUrl()}/integrations?error=${reason}`);
  res.cookies.set("li_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const oauthError = params.get("error");

  if (oauthError) return fail(oauthError);
  if (!code || !state) return fail("missing_code");

  // CSRF: state must match the cookie set at /start.
  const cookieState = request.cookies.get("li_oauth_state")?.value;
  if (!cookieState || cookieState !== state) return fail("state_mismatch");

  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return NextResponse.redirect(`${appUrl()}/login?redirectedFrom=/integrations`);
  }

  try {
    const token = await exchangeCode(code);
    const profile = await fetchProfile(token.accessToken);
    const expiresAt = new Date(Date.now() + token.expiresIn * 1000).toISOString();

    await storeConnection(ctx.supabase, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      platform: "linkedin",
      accountName: profile.name,
      accountHandle: profile.email,
      externalId: profile.sub,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      scope: token.scope,
      expiresAt,
    });

    const res = NextResponse.redirect(`${appUrl()}/integrations?connected=linkedin`);
    res.cookies.set("li_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return fail("linkedin_connect_failed");
  }
}
