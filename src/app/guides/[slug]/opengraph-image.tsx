import { ImageResponse } from "next/og";
import { loadGuide, guideSlugs } from "@/lib/content";

export const alt = "Giftaro guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await guideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const guide = await loadGuide(params.slug);
  const title = guide?.title ?? "Giftaro guide";
  const description = guide?.description ?? "Giftaro";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafafa",
          backgroundImage:
            "radial-gradient(ellipse at top right, rgba(219,39,119,0.22) 0%, rgba(139,92,246,0.14) 32%, transparent 60%)",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 800 }}>
          <span style={{ color: "#18181b" }}>Gift</span>
          <span style={{ color: "#DB4437" }}>a</span>
          <span style={{ color: "#0F9D58" }}>r</span>
          <span style={{ color: "#4285F4" }}>o</span>
          <span style={{ color: "#52525b", marginLeft: 16, fontWeight: 500 }}>
            / Guide
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#18181b",
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#52525b",
              marginTop: 24,
              lineHeight: 1.35,
              maxWidth: 1000,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
