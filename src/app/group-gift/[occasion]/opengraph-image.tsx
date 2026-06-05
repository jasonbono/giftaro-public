import { ImageResponse } from "next/og";
import { getOccasion, occasionSlugs } from "@/data/occasions";

export const alt = "Group gift on Giftaro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const dynamicParams = false;

export async function generateStaticParams() {
  return occasionSlugs().map((occasion) => ({ occasion }));
}

export default async function Image({
  params,
}: {
  params: { occasion: string };
}) {
  const o = getOccasion(params.occasion);
  const title = o?.title ?? "Group gift on Giftaro";
  const description = o?.shortDescription ?? "Pool one great gift on Giftaro.";

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
            "radial-gradient(ellipse at bottom left, rgba(99,102,241,0.20) 0%, rgba(236,72,153,0.14) 32%, transparent 60%)",
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
            / Group gift
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
