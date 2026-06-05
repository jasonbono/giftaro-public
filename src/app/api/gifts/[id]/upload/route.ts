import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { db } from "@/lib/drizzle";
import { gifts, users } from "@/lib/drizzle-schema";
import { eq, and, isNull } from "drizzle-orm";
import { validateUpload } from "@/lib/image";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_UPLOADS_PER_GIFT = 50;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(`upload:${getClientIp(request)}`, 5);
    if (limited) return limited;

    const { id } = await params;
    const gift = await db.select({ id: gifts.id })
      .from(gifts)
      .innerJoin(users, eq(users.id, gifts.userId))
      .where(and(
        eq(gifts.id, id),
        isNull(gifts.trashedAt),
        eq(gifts.status, "open"),
        eq(users.chargesEnabled, 1),
      ));
    if (gift.length === 0) {
      return NextResponse.json({ error: "Gift not found or not accepting contributions" }, { status: 404 });
    }

    const existing = await list({ prefix: `contributions/${id}/`, limit: MAX_UPLOADS_PER_GIFT + 1 });
    if (existing.blobs.length >= MAX_UPLOADS_PER_GIFT) {
      return NextResponse.json({ error: "Upload limit reached for this gift" }, { status: 429 });
    }

    const formData = await request.formData();
    const validated = await validateUpload(formData);
    if (validated instanceof NextResponse) return validated;
    const { file, safeName } = validated;

    const blob = await put(`contributions/${id}/${safeName}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
