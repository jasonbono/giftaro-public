import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { gifts } from "@/lib/drizzle-schema";
import { eq, and, isNull, sql } from "drizzle-orm";


export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const { id } = await params;
    const gift = await db.select().from(gifts).where(
      and(eq(gifts.id, id), eq(gifts.userId, userId), isNull(gifts.trashedAt), eq(gifts.status, "closed"))
    );

    if (gift.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await db.update(gifts)
      .set({ status: "open", updatedAt: sql`datetime('now')` })
      .where(and(eq(gifts.id, id), eq(gifts.userId, userId), eq(gifts.status, "closed")))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Already changed" }, { status: 409 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Reopen gift error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
