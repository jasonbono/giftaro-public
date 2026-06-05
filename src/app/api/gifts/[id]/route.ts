import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { gifts } from "@/lib/drizzle-schema";
import { eq, and, isNull, sql } from "drizzle-orm";

import { proxyImageToBlob, validateImageGallery } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db.select({
      id: gifts.id,
      title: gifts.title,
      description: gifts.description,
      target_amount_cents: gifts.targetAmountCents,
      organizer_name: gifts.organizerName,
      currency: gifts.currency,
      total_contributed_cents: gifts.totalContributedCents,
      status: gifts.status,
      event_date: gifts.eventDate,
      product_url: gifts.productUrl,
      og_image: gifts.ogImage,
      og_title: gifts.ogTitle,
      og_description: gifts.ogDescription,
      image_zoom: gifts.imageZoom,
      image_offset_x: gifts.imageOffsetX,
      image_offset_y: gifts.imageOffsetY,
      ai_images_generated: gifts.aiImagesGenerated,
      image_gallery: gifts.imageGallery,
      created_at: gifts.createdAt,
    })
      .from(gifts)
      .where(and(eq(gifts.id, id), isNull(gifts.trashedAt)));

    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Get gift error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const { id } = await params;

    const gift = await db.select()
      .from(gifts)
      .where(and(eq(gifts.id, id), eq(gifts.userId, userId), isNull(gifts.trashedAt)));

    if (gift.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, target_amount_cents, og_image, og_title, og_description, image_zoom, image_offset_x, image_offset_y, image_gallery, organizer_name } = body;

    if (!title || !og_title) {
      return NextResponse.json({ error: "Gift name and title are required" }, { status: 400 });
    }

    if (!organizer_name || typeof organizer_name !== "string" || organizer_name.trim().length === 0) {
      return NextResponse.json({ error: "Organizer name is required" }, { status: 400 });
    }

    if (!target_amount_cents || target_amount_cents < 1000) {
      return NextResponse.json({ error: "Goal must be at least $10" }, { status: 400 });
    }

    const raised = gift[0].totalContributedCents || 0;
    if (target_amount_cents < raised) {
      return NextResponse.json(
        { error: `Goal can't be less than $${(raised / 100).toFixed(2)} already raised` },
        { status: 400 }
      );
    }

    // Proxy external image to Vercel Blob so it never breaks
    let finalImage = og_image || null;
    if (finalImage) {
      const proxied = await proxyImageToBlob(finalImage);
      if (proxied) finalImage = proxied;
    }

    let gallery: string | null = null;
    if (image_gallery != null) {
      gallery = validateImageGallery(image_gallery);
      if (gallery === null) {
        return NextResponse.json({ error: "Invalid gallery" }, { status: 400 });
      }
    }

    const result = await db.update(gifts)
      .set({
        title,
        description: description || null,
        targetAmountCents: target_amount_cents,
        organizerName: organizer_name.trim(),
        ogImage: finalImage,
        ogTitle: og_title || null,
        ogDescription: og_description || null,
        imageZoom: image_zoom ?? 1,
        imageOffsetX: image_offset_x ?? 0,
        imageOffsetY: image_offset_y ?? 0,
        imageGallery: gallery,
        updatedAt: sql`datetime('now')`,
      })
      .where(and(eq(gifts.id, id), eq(gifts.userId, userId)))
      .returning();

    const row = result[0];
    return NextResponse.json({
      id: row.id,
      user_id: row.userId,
      title: row.title,
      description: row.description,
      target_amount_cents: row.targetAmountCents,
      organizer_name: row.organizerName,
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
      ai_images_generated: row.aiImagesGenerated,
      image_gallery: row.imageGallery,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
  } catch (error) {
    console.error("Update gift error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
