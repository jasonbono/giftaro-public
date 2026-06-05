import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { gifts } from "@/lib/drizzle-schema";
import { eq, and, sql } from "drizzle-orm";


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
    const { image_zoom, image_offset_x, image_offset_y } = await request.json();

    const zoom = image_zoom;
    const offsetX = image_offset_x ?? 0;
    const offsetY = image_offset_y ?? 0;

    if (typeof zoom !== "number" || !Number.isFinite(zoom) || zoom < 1 || zoom > 3) {
      return NextResponse.json({ error: "Invalid zoom" }, { status: 400 });
    }
    if (typeof offsetX !== "number" || !Number.isFinite(offsetX)) {
      return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
    }
    if (typeof offsetY !== "number" || !Number.isFinite(offsetY)) {
      return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
    }

    const result = await db.update(gifts)
      .set({
        imageZoom: zoom,
        imageOffsetX: offsetX,
        imageOffsetY: offsetY,
        updatedAt: sql`datetime('now')`,
      })
      .where(and(eq(gifts.id, id), eq(gifts.userId, userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = result[0];
    return NextResponse.json({
      id: row.id,
      user_id: row.userId,
      title: row.title,
      description: row.description,
      target_amount_cents: row.targetAmountCents,
      currency: row.currency,
      total_contributed_cents: row.totalContributedCents,
      status: row.status,
      event_date: row.eventDate,
      product_url: row.productUrl,
      og_image: row.ogImage,
      og_title: row.ogTitle,
      og_description: row.ogDescription,
      image_zoom: row.imageZoom,
      image_offset_x: row.imageOffsetX,
      image_offset_y: row.imageOffsetY,
      trashed_at: row.trashedAt,
      expected_contributors: row.expectedContributors,
      fully_funded_notified: row.fullyFundedNotified,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
  } catch (error) {
    console.error("Crop gift error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
