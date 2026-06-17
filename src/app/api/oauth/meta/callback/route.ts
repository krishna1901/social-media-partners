import { NextResponse, type NextRequest } from "next/server";
import { getDbContext, isLive } from "@/lib/db/context";
import {
  exchangeCode,
  exchangeForLongLived,
  listManagedPages,
} from "@/lib/integrations/meta";
import { storeConnection } from "@/lib/db/social-tokens";

/**
 * Meta OAuth callback (Phase 3D).
 *
 * Verifies state, exchanges the code for a long-lived user token, picks the
 * first managed Page, and stores encrypted connections: "facebook" (Page token
 * + Page id) and, when a linked IG Business account exists, "instagram"
 * (Page token + IG id). Redirects back to /integrations.
 */
export const dynamic = "force-dynamic";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function fail(reason: string): NextResponse {
  const res = NextResponse.redirect(`${appUrl()}/integrations?error=${reason}`);
  res.cookies.set("meta_oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const oauthError = params.get("error");

  if (oauthError) return fail(oauthError);
  if (!code || !state) return fail("missing_code");

  const cookieState = request.cookies.get("meta_oauth_state")?.value;
  if (!cookieState || cookieState !== state) return fail("state_mismatch");

  const ctx = await getDbContext();
  if (!isLive(ctx)) {
    return NextResponse.redirect(`${appUrl()}/login?redirectedFrom=/integrations`);
  }

  try {
    const short = await exchangeCode(code);
    let userToken = short.accessToken;
    let expiresIn = short.expiresIn;
    try {
      const long = await exchangeForLongLived(userToken);
      userToken = long.accessToken;
      expiresIn = long.expiresIn || expiresIn;
    } catch {
      /* keep the short-lived token if the long-lived exchange fails */
    }

    const pages = await listManagedPages(userToken);
    if (pages.length === 0) return fail("no_facebook_page");
    const page = pages[0];

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    // Facebook Page connection (Page access token).
    await storeConnection(ctx.supabase, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      platform: "facebook",
      accountName: page.name,
      accountHandle: null,
      externalId: page.id,
      accessToken: page.accessToken,
      scope: "pages_manage_posts",
      expiresAt,
    });

    // Instagram connection (same Page token, IG Business id) when linked.
    if (page.instagramId) {
      await storeConnection(ctx.supabase, {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        platform: "instagram",
        accountName: page.instagramUsername ?? page.name,
        accountHandle: page.instagramUsername,
        externalId: page.instagramId,
        accessToken: page.accessToken,
        scope: "instagram_content_publish",
        expiresAt,
      });
    }

    const connected = page.instagramId ? "facebook%2Cinstagram" : "facebook";
    const res = NextResponse.redirect(`${appUrl()}/integrations?connected=${connected}`);
    res.cookies.set("meta_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return fail("meta_connect_failed");
  }
}
