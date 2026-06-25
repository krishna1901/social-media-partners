import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * robots.txt (served at /robots.txt). Allows the public marketing pages and
 * disallows authenticated app surfaces, admin, API, and transactional/auth
 * routes (the (app)/(auth)/(marketing) route groups are stripped from the URL,
 * so these prefixes are the real paths). References the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/analytics",
        "/posts",
        "/calendar",
        "/inbox",
        "/studio",
        "/content-studio",
        "/ideas",
        "/trends",
        "/competitors",
        "/media",
        "/integrations",
        "/automations",
        "/billing",
        "/settings",
        "/admin",
        "/api/",
        "/login",
        "/signup",
        "/suspended",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
