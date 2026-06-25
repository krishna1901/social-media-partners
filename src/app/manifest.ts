import type { MetadataRoute } from "next";

/** PWA web app manifest (served at /manifest.webmanifest). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SocialFlow AI — AI Content Command Center",
    short_name: "SocialFlow AI",
    description:
      "SocialFlow AI is an AI-powered content intelligence, scheduling, analytics, inbox, and automation platform for creators, marketers, agencies, and small businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#e85d2a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
