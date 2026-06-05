import { getSession, requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { users } from "@/lib/drizzle-schema";
import { eq, and, sql } from "drizzle-orm";

import { ensureUser } from "@/lib/user";
import { createConnectedAccount, createAccountLink } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;
    const session = await getSession();
    const email = session?.user?.email || "";
    const name = session?.user?.name || "User";
    await ensureUser(userId, name, email);

    const origin = new URL(request.url).origin;

    const existing = await db.select({
        stripeAccountId: users.stripeAccountId,
        testMode: users.testMode,
      })
      .from(users)
      .where(eq(users.id, userId));

    const testMode = !!existing[0]?.testMode;

    let stripeAccountId: string;

    if (existing.length > 0 && existing[0].stripeAccountId) {
      stripeAccountId = existing[0].stripeAccountId;
    } else {
      const account = await createConnectedAccount(userId, email, name, testMode);
      stripeAccountId = account.id;

      const updated = await db.update(users)
        .set({
          stripeAccountId,
          onboardingStatus: "started",
          updatedAt: sql`datetime('now')`,
        })
        .where(and(eq(users.id, userId), sql`stripe_account_id IS NULL`))
        .returning({ stripeAccountId: users.stripeAccountId });

      if (updated.length === 0) {
        const refetch = await db.select({ stripeAccountId: users.stripeAccountId })
          .from(users).where(eq(users.id, userId));
        if (!refetch[0]?.stripeAccountId) {
          return NextResponse.json({ error: "Failed to link Stripe account" }, { status: 500 });
        }
        stripeAccountId = refetch[0].stripeAccountId;
      }
    }

    const accountLink = await createAccountLink(
      stripeAccountId,
      `${origin}/api/stripe/connect/return`,
      `${origin}/api/stripe/connect/refresh`,
      testMode
    );

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe connect error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
