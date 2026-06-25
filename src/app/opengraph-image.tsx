import { ImageResponse } from "next/og";

/**
 * Generated Open Graph image (1200×630), inherited by all routes and reused for
 * the Twitter summary_large_image card. Pure next/og — no external font or asset
 * reads, so it never fails at build. Resolves to an absolute URL via the root
 * metadataBase. Drop an opengraph-image.png here later to override with a static
 * branded asset.
 */
export const alt = "SocialFlow AI — AI Content Command Center";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1120 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "linear-gradient(135deg, #f97316, #ef4444)",
            }}
          />
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700 }}>
            <span>SocialFlow&nbsp;</span>
            <span style={{ color: "#f97316" }}>AI</span>
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          AI Content Command Center
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#cbd5e1", maxWidth: 920 }}>
          Content intelligence, scheduling, analytics, inbox, and automation.
        </div>
      </div>
    ),
    { ...size }
  );
}
