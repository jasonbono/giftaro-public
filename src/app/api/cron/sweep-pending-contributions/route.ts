import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { contributions } from "@/lib/drizzle-schema";
import { and, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Stripe Checkout Sessions expire 24h after creation, so any contribution
// still "pending" past that point is a dead session (network-failed retry,
// abandoned tab, etc.). Mark them "abandoned" so analytics aren't polluted
// by dead rows and genuinely pending contributions stay distinguishable.
// Vercel cron runs daily; request is authenticated by CRON_SECRET.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .update(contributions)
    .set({ status: "abandoned", updatedAt: sql`datetime('now')` })
    .where(and(
      eq(contributions.status, "pending"),
      sql`${contributions.createdAt} < datetime('now', '-24 hours')`,
    ));

  return NextResponse.json({ swept: result.rowsAffected });
}
