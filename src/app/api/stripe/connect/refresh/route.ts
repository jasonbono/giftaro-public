import { getSession } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { users } from "@/lib/drizzle-schema";
import { eq } from "drizzle-orm";
import { createAccountLink } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.redirect(new URL("/?returnTo=/dashboard", request.url));

    const origin = new URL(request.url).origin;

    const result = await db.select({
        stripeAccountId: users.stripeAccountId,
        testMode: users.testMode,
      })
      .from(users).where(eq(users.id, userId));

    if (result.length === 0 || !result[0].stripeAccountId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const accountLink = await createAccountLink(
      result[0].stripeAccountId,
      `${origin}/api/stripe/connect/return`,
      `${origin}/api/stripe/connect/refresh`,
      !!result[0].testMode
    );

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error("Stripe connect refresh error:", error);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
