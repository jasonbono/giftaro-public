import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { users } from "@/lib/drizzle-schema";
import { eq } from "drizzle-orm";
import { createDashboardLoginLink } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const result = await db.select({
        stripeAccountId: users.stripeAccountId,
        testMode: users.testMode,
      })
      .from(users).where(eq(users.id, userId));

    const stripeAccountId = result[0]?.stripeAccountId;
    if (!stripeAccountId) {
      return NextResponse.json({ error: "No Stripe account connected" }, { status: 400 });
    }

    const loginLink = await createDashboardLoginLink(stripeAccountId, !!result[0].testMode);
    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("Stripe dashboard link error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
