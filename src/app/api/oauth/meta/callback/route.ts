import { NextResponse, type NextRequest } from "next/server";
import { getDbContext, isLive } from "@/lib/db/context";
import {
  exchangeCode,
  exchangeForLongLived,
  listManagedPages,
  listGrantedPermissions,
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
    // Clear the consumed state cookie even here so the code+state can't be
    // replayed within its maxAge after re-auth.
    const res = NextResponse.redirect(`${appUrl()}/login?redirectedFrom=/integrations`);
    res.cookies.set("meta_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
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

    // The permissions the user actually granted (a user can decline scopes).
    let granted: string[] = [];
    try {
      granted = await listGrantedPermissions(userToken);
    } catch {
      /* non-fatal — proceed without an authoritative permission list */
    }
    const canPublishInstagram = granted.includes("instagram_content_publish");

    // Prefer a Page that has a linked Instagram professional account so the
    // Facebook + Instagram connections share the same Page token.
    const igPage = pages.find((p) => p.instagramId);
    const page = igPage ?? pages[0];

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
      permissions: granted.length ? granted : null,
    });

    // No Instagram professional/business account linked to any Page.
    if (!igPage) {
      const res = NextResponse.redirect(
        `${appUrl()}/integrations?connected=facebook&ig=not_professional`
      );
      res.cookies.set("meta_oauth_state", "", { maxAge: 0, path: "/" });
      return res;
    }

    // Instagram connection (same Page token, IG Business id). Stored even when
    // the publish permission wasn't granted so the account shows as connected;
    // the UI surfaces that publishing needs the permission + App Review.
    await storeConnection(ctx.supabase, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      platform: "instagram",
      accountName: igPage.instagramUsername ?? igPage.name,
      accountHandle: igPage.instagramUsername,
      externalId: igPage.instagramId,
      accessToken: igPage.accessToken,
      scope: "instagram_content_publish",
      expiresAt,
      permissions: granted.length ? granted : null,
    });

    const igSignal = canPublishInstagram ? "" : "&ig=missing_publish_permission";
    const res = NextResponse.redirect(
      `${appUrl()}/integrations?connected=facebook%2Cinstagram${igSignal}`
    );
    res.cookies.set("meta_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return fail("meta_connect_failed");
  }
}
