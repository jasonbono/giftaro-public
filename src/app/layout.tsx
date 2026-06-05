import type { Metadata } from "next";
import { Geist, Silkscreen } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PledgeFooter } from "@/components/pledge-footer";
import { BASE_URL } from "@/lib/constants";
import { JsonLd } from "@/components/json-ld";
import {
  organizationSchema,
  websiteSchema,
  webApplicationSchema,
} from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Giftaro — One great gift.",
  description:
    "Skip the pile of stuff. Get one great gift. Name your gift, share the link, everyone chips in.",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Giftaro — One great gift.",
    description:
      "Skip the pile of stuff. Get one great gift. Name your gift, share the link, everyone chips in.",
    url: "/",
    siteName: "Giftaro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giftaro — One great gift.",
    description:
      "Skip the pile of stuff. Get one great gift. Name your gift, share the link, everyone chips in.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${silkscreen.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <JsonLd
          data={[organizationSchema(), websiteSchema(), webApplicationSchema()]}
        />
      </head>
      <body className="min-h-[100dvh] font-sans">
        {/*
         * Layer 2: Breathing radial glow. willChange hints the browser to
         * promote this element to its own GPU layer so the opacity+scale
         * animation composites entirely on the GPU and doesn't force the
         * 1200×1200 gradient to repaint during scroll.
         */}
        <div
          className="pointer-events-none fixed z-0"
          style={{
            width: 1200,
            height: 1200,
            left: "50%",
            top: "45%",
            transform: "translate(-50%, -55%)",
            background: "radial-gradient(ellipse at center, rgba(219,39,119,0.18) 0%, rgba(139,92,246,0.10) 25%, rgba(251,146,60,0.06) 45%, transparent 70%)",
            animation: "glow-breathe 8s ease-in-out infinite alternate",
            willChange: "opacity, transform",
          }}
        />
        {/* Layer 3: Grain texture — tiled, see .grain-overlay in globals.css */}
        <div className="grain-overlay pointer-events-none fixed inset-0 z-[100] opacity-[0.12]" />
        {/* Content */}
        <div className="relative z-[1]">
          {children}
          <PledgeFooter />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
