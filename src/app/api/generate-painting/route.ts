import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { gifts } from "@/lib/drizzle-schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { put } from "@vercel/blob";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_PAINTINGS = 5;

export async function POST(request: Request) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const limited = rateLimit(`painting:${userId}`, 3);
    if (limited) return limited;

    const body = await request.json();
    const { gift_name, gift_id } = body as { gift_name: string; gift_id?: string };

    if (!gift_name || gift_name.trim().length === 0) {
      return NextResponse.json({ error: "Gift name is required" }, { status: 400 });
    }

    // Require gift_id so every generation increments a per-gift counter. The
    // earlier "gift_id is optional" branch let any authenticated user burn
    // unlimited OpenAI credit by calling in a loop under the 3/min limit —
    // nothing tied those requests to a MAX_PAINTINGS cap.
    if (!gift_id || typeof gift_id !== "string") {
      return NextResponse.json({ error: "Gift id is required" }, { status: 400 });
    }

    const gift = await db
      .select({ id: gifts.id })
      .from(gifts)
      .where(and(eq(gifts.id, gift_id), eq(gifts.userId, userId), isNull(gifts.trashedAt)));

    if (gift.length === 0) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    const reserved = await db
      .update(gifts)
      .set({
        aiImagesGenerated: sql`ai_images_generated + 1`,
        updatedAt: sql`datetime('now')`,
      })
      .where(and(
        eq(gifts.id, gift_id),
        eq(gifts.userId, userId),
        sql`ai_images_generated < ${MAX_PAINTINGS}`,
      ))
      .returning({ aiImagesGenerated: gifts.aiImagesGenerated });

    if (reserved.length === 0) {
      return NextResponse.json(
        { error: "You've used all your Giftaro paintings", count: MAX_PAINTINGS },
        { status: 429 }
      );
    }

    const reservedCount = reserved[0].aiImagesGenerated || 0;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await rollbackPaintingCount(gift_id);
      return NextResponse.json({ error: "Image generation not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    // Production image-generation prompts are redacted from this public snapshot.
    // The multi-style structure and selection logic are preserved.
    const PROMPTS = {
      pixel: `A ${gift_name.trim()} illustration. [style prompt redacted]`,
      ukiyo: `A ${gift_name.trim()} illustration. [style prompt redacted]`,
      isometric: `A ${gift_name.trim()} illustration. [style prompt redacted]`,
    };

    const style = "isometric" as keyof typeof PROMPTS;
    const prompt = PROMPTS[style];

    let result;
    try {
      result = await openai.images.generate({
        model: "gpt-image-1-mini",
        prompt,
        quality: "medium",
        size: "1024x1024",
        background: "opaque",
      });
    } catch (genError) {
      await rollbackPaintingCount(gift_id);
      throw genError;
    }

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      await rollbackPaintingCount(gift_id);
      return NextResponse.json({ error: "No image returned" }, { status: 502 });
    }

    const buffer = Buffer.from(b64, "base64");
    const blob = await put(`gifts/paintings/${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png",
    });

    return NextResponse.json({ url: blob.url, count: reservedCount });
  } catch (error) {
    console.error("Generate painting error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function rollbackPaintingCount(giftId: string) {
  try {
    await db
      .update(gifts)
      .set({
        aiImagesGenerated: sql`MAX(ai_images_generated - 1, 0)`,
        updatedAt: sql`datetime('now')`,
      })
      .where(eq(gifts.id, giftId));
  } catch (e) {
    console.error("Failed to rollback painting count:", e);
  }
}
