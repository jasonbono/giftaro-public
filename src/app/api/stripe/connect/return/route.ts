import { getSession } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { users, gifts } from "@/lib/drizzle-schema";
import { and, eq, isNull, desc } from "drizzle-orm";
import { getAccount } from "@/lib/stripe";
import { syncStripeAccountStatus } from "@/lib/gifts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.redirect(new URL("/?returnTo=/dashboard", request.url));

    const result = await db.select({
        stripeAccountId: users.stripeAccountId,
        testMode: users.testMode,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (result.length > 0 && result[0].stripeAccountId) {
      const account = await getAccount(result[0].stripeAccountId, !!result[0].testMode);
      await syncStripeAccountStatus(account, { userId });
    }

    const recentGift = await db
      .select({ id: gifts.id })
      .from(gifts)
      .where(and(eq(gifts.userId, userId), eq(gifts.status, "open"), isNull(gifts.trashedAt)))
      .orderBy(desc(gifts.createdAt))
      .limit(1);

    const target = recentGift.length > 0
      ? `/dashboard/gifts/${recentGift[0].id}?linked=1`
      : "/dashboard?linked=1";

    return NextResponse.redirect(new URL(target, request.url));
  } catch (error) {
    console.error("Stripe connect return error:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
