import { ImageResponse } from "next/og";

export const alt = "Giftaro — One great gift.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(219,39,119,0.28) 0%, rgba(139,92,246,0.18) 28%, rgba(251,146,60,0.10) 52%, transparent 72%)",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          <span style={{ color: "#18181b" }}>Gift</span>
          <span style={{ color: "#DB4437" }}>a</span>
          <span style={{ color: "#0F9D58" }}>r</span>
          <span style={{ color: "#4285F4" }}>o</span>
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 800,
            color: "#18181b",
            marginTop: 48,
            letterSpacing: -5,
            textAlign: "center",
          }}
        >
          One great gift.
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#52525b",
            marginTop: 28,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Chip in with family and friends for one gift that actually matters.
        </div>
      </div>
    ),
    { ...size }
  );
}
