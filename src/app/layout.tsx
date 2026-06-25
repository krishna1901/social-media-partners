import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const siteDescription =
  "SocialFlow AI is an AI-powered content intelligence, scheduling, analytics, inbox, and automation platform for creators, marketers, agencies, and small businesses.";
const ogDescription =
  "Plan, create, schedule, and grow across every social platform with one premium, AI-powered workspace.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SocialFlow AI — AI Content Command Center",
    template: "%s · SocialFlow AI",
  },
  description: siteDescription,
  applicationName: "SocialFlow AI",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "SocialFlow AI",
    url: "/",
    title: "SocialFlow AI — AI Content Command Center",
    description: ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialFlow AI — AI Content Command Center",
    description: ogDescription,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d18" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
