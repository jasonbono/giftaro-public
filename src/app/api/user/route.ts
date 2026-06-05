import { requireAuth } from "@/lib/auth-session";
import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import {
  users,
  gifts,
  contributions,
  sessions,
  accounts,
  verifications,
} from "@/lib/drizzle-schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const authed = await requireAuth();
    if (authed instanceof NextResponse) return authed;
    const { userId } = authed;

    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const user = userRows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activeGifts = await db
      .select({ id: gifts.id })
      .from(gifts)
      .where(
        and(
          eq(gifts.userId, userId),
          eq(gifts.status, "open"),
          isNull(gifts.trashedAt),
        ),
      );

    if (activeGifts.length > 0) {
      const activeGiftIds = activeGifts.map((g) => g.id as string);
      const funded = await db
        .select({ id: contributions.id })
        .from(contributions)
        .where(
          and(
            inArray(contributions.giftId, activeGiftIds),
            eq(contributions.status, "succeeded"),
          ),
        )
        .limit(1);

      if (funded.length > 0) {
        return NextResponse.json(
          {
            error:
              "Settle or close your active gifts before deleting your account.",
          },
          { status: 409 },
        );
      }
    }

    if (user.stripeAccountId) {
      try {
        await stripe(!!user.testMode).accounts.del(user.stripeAccountId);
      } catch (err) {
        console.error("Stripe account delete failed (proceeding):", err);
      }
    }

    const userGifts = await db
      .select({ id: gifts.id })
      .from(gifts)
      .where(eq(gifts.userId, userId));
    const userGiftIds = userGifts.map((g) => g.id as string);

    await db.transaction(async (tx) => {
      if (userGiftIds.length > 0) {
        await tx
          .delete(contributions)
          .where(inArray(contributions.giftId, userGiftIds));
        await tx.delete(gifts).where(eq(gifts.userId, userId));
      }
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      if (user.email) {
        await tx
          .delete(verifications)
          .where(eq(verifications.identifier, user.email));
      }
      await tx.delete(users).where(eq(users.id, userId));
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.delete("better-auth.session_token");
    response.cookies.delete("__Secure-better-auth.session_token");
    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
