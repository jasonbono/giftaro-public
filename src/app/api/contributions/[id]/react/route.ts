import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { reactions, contributions, users } from "@/lib/drizzle-schema";
import { eq, and, asc } from "drizzle-orm";


export const dynamic = "force-dynamic";

const VALID_TYPES = ["thank", "laugh", "love"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contributionId } = await params;

    const rows = await db
      .select({
        userId: reactions.userId,
        reactionType: reactions.reactionType,
        createdAt: reactions.createdAt,
        name: users.name,
        image: users.image,
      })
      .from(reactions)
      .innerJoin(users, eq(users.id, reactions.userId))
      .where(eq(reactions.contributionId, contributionId))
      .orderBy(asc(reactions.createdAt));

    return NextResponse.json({
      reactors: rows.map((r) => ({
        userId: r.userId as string,
        reactionType: r.reactionType as string,
        name: (r.name as string) || "Someone",
        image: (r.image as string | null) ?? null,
      })),
    });
  } catch (error) {
    console.error("React GET error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const { id: contributionId } = await params;
    const { type } = await request.json();

    const contrib = await db.select({ id: contributions.id })
      .from(contributions)
      .where(eq(contributions.id, contributionId));

    if (contrib.length === 0) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const existing = await db.select({ id: reactions.id })
      .from(reactions)
      .where(and(
        eq(reactions.contributionId, contributionId),
        eq(reactions.userId, userId),
        eq(reactions.reactionType, type),
      ));

    if (existing.length > 0) {
      await db.delete(reactions)
        .where(and(
          eq(reactions.contributionId, contributionId),
          eq(reactions.userId, userId),
          eq(reactions.reactionType, type),
        ));
      return NextResponse.json({ toggled: "off" });
    }

    await db.insert(reactions)
      .values({
        contributionId,
        userId,
        reactionType: type,
      });
    return NextResponse.json({ toggled: "on" });
  } catch (error) {
    console.error("React error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
