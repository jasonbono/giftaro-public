import { db } from "./drizzle";
import { gifts, contributions, users } from "./drizzle-schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import type Stripe from "stripe";

export const FUNDING_GRACE_HOURS = 24;

export async function recalculateGiftTotal(giftId: string) {
  await db
    .update(gifts)
    .set({
      totalContributedCents: sql`(SELECT COALESCE(SUM(${contributions.amountCents}), 0) FROM ${contributions} WHERE ${contributions.giftId} = ${giftId} AND ${contributions.status} = 'succeeded')`,
      updatedAt: sql`datetime('now')`,
    })
    .where(eq(gifts.id, giftId));
}

export async function enforceAutoClose(giftId: string) {
  await db
    .update(gifts)
    .set({ status: "closed", updatedAt: sql`datetime('now')` })
    .where(and(
      eq(gifts.id, giftId),
      eq(gifts.status, "open"),
      isNotNull(gifts.fullyFundedAt),
      sql`(julianday('now') - julianday(${gifts.fullyFundedAt})) * 24 >= ${FUNDING_GRACE_HOURS}`,
    ));
}

export async function syncStripeAccountStatus(
  account: Stripe.Account,
  where: { userId?: string; stripeAccountId?: string }
) {
  const status = account.details_submitted ? "complete" : "started";
  const condition = where.userId
    ? eq(users.id, where.userId)
    : eq(users.stripeAccountId, account.id);

  await db
    .update(users)
    .set({
      chargesEnabled: account.charges_enabled ? 1 : 0,
      payoutsEnabled: account.payouts_enabled ? 1 : 0,
      detailsSubmitted: account.details_submitted ? 1 : 0,
      onboardingStatus: status,
      stripeStatusSyncedAt: sql`datetime('now')`,
      updatedAt: sql`datetime('now')`,
    })
    .where(condition);
}

