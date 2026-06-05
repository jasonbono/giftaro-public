import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Contributor avatars are only ever a relative /stock/ path or a Vercel
    // Blob URL (enforced by isAllowedOwnBlobUrl on the checkout/upload APIs).
    // Keep this list in lockstep with that allowlist.
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "**.vercel-storage.com" },
    ],
  },
  async headers() {
    const immutable = {
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    };
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Content-addressed asset folders — new artwork ships as a new file,
      // so we can aggressively cache what's already there. If we ever need
      // to swap contents of an existing filename, bust with a ?v=N query.
      { source: "/stock/:path*", headers: [immutable] },
      { source: "/examples/:path*", headers: [immutable] },
      // Brand PNGs used across the shell (header logo + hero gift marks).
      // Same deal — stable filenames, bust via ?v=N on the rare rename.
      { source: "/gift_blue_smile_v4.png", headers: [immutable] },
      { source: "/gift_red.png", headers: [immutable] },
      { source: "/gifts_trio.png", headers: [immutable] },
    ];
  },
};

export default nextConfig;
