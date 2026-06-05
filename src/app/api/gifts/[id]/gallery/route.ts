import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { gifts } from "@/lib/drizzle-schema";
import { eq, and, sql } from "drizzle-orm";
import { isAllowedOwnBlobUrl, validateImageGallery } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const { id } = await params;
    const { og_image, image_gallery } = await request.json();

    // Without this check an organizer could point `og_image` at attacker.com;
    // the URL would then render as <img src> on every public gift page and
    // as the OG preview image, leaking visitor IPs/referers and giving the
    // attacker swap-at-will control over what viewers see.
    if (og_image != null) {
      if (typeof og_image !== "string" || !isAllowedOwnBlobUrl(og_image)) {
        return NextResponse.json({ error: "Invalid image" }, { status: 400 });
      }
    }

    let galleryValue: string | null | undefined = undefined;
    if (image_gallery != null) {
      const validated = validateImageGallery(image_gallery);
      if (validated === null) {
        return NextResponse.json({ error: "Invalid gallery" }, { status: 400 });
      }
      galleryValue = validated;
    }

    const result = await db.update(gifts)
      .set({
        ogImage: og_image ?? undefined,
        imageGallery: galleryValue ?? undefined,
        updatedAt: sql`datetime('now')`,
      })
      .where(and(eq(gifts.id, id), eq(gifts.userId, userId)))
      .returning({ id: gifts.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gallery save error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
