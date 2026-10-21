import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CommandPalette } from "@/components/site/CommandPalette";
import { Enhancers } from "@/components/site/Enhancers";
import { SiteJsonLd } from "@/components/site/JsonLd";
import { themeScript } from "@/components/site/theme";
import { viewTransitionGuardScript } from "@/components/site/view-transitions";
import { SITE } from "@/lib/site";
import { FEEDS } from "@/lib/seo";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
// Used sparingly, in italic, for warmth against Geist.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s — ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.author, url: SITE.url }],
  creator: SITE.author,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: "/api/og", width: 1200, height: 630, alt: SITE.title }],
  },
  twitter: { card: "summary_large_image", creator: SITE.twitterHandle, images: ["/api/og"] },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  // No canonical here: pages set their own via pageMetadata(). A root canonical
  // would be inherited by any page that forgot, pointing it at the homepage.
  alternates: { types: FEEDS },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  // SVG first: it follows the browser's light/dark theme. ICO/PNG are fallbacks.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: viewTransitionGuardScript }} />
      </head>
      <body className="relative isolate min-h-dvh font-sans antialiased">
        <div className="aurora" aria-hidden />
        <SiteJsonLd />
        <Header />
        <main id="main" className="relative isolate">
          {/* Navigations crossfade; named elements inside (post art) morph. */}
          <ViewTransition>{children}</ViewTransition>
        </main>
        <Footer />
        <CommandPalette />
        <Enhancers />
        <Analytics />
      </body>
    </html>
  );
}
