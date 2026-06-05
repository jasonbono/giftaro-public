import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const limited = rateLimit(`pixel-art:${getClientIp(request)}`, 10);
    if (limited) return limited;

    const body = await request.json();
    const { dataUrl } = body as { dataUrl: string };

    if (!dataUrl || !dataUrl.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    if (buffer.length > 100 * 1024) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }

    const blob = await put(`pixel-art/${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Pixel art upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
