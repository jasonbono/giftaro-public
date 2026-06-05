import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { users, gifts } from "@/lib/drizzle-schema";
import { eq } from "drizzle-orm";

import { proxyImageToBlob, validateImageGallery } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const body = await request.json();
    const { title, description, target_amount_cents, og_image, og_title, og_description, image_zoom, image_offset_x, image_offset_y, image_gallery, organizer_name } = body;

    if (!title || !og_title || !target_amount_cents || target_amount_cents < 1000) {
      return NextResponse.json({ error: "Gift name, title, and goal (at least $10) are required" }, { status: 400 });
    }

    if (!organizer_name || typeof organizer_name !== "string" || organizer_name.trim().length === 0) {
      return NextResponse.json({ error: "Organizer name is required" }, { status: 400 });
    }

    const user = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
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

    const result = await db.insert(gifts)
      .values({
        userId,
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
      })
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
    }, { status: 201 });
  } catch (error) {
    console.error("Create gift error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
