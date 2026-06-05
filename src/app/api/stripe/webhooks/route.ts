import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { contributions, gifts, users, webhookEventLog } from "@/lib/drizzle-schema";
import { eq, and, ne, isNull, sql } from "drizzle-orm";
import { sendContributionEmail, sendContributorReceiptEmail, sendFullyFundedEmail } from "@/lib/email";
import { constructWebhookEvent } from "@/lib/stripe";
import { recalculateGiftTotal, syncStripeAccountStatus } from "@/lib/gifts";
import { BASE_URL } from "@/lib/constants";
import { giftDisplayTitle } from "@/lib/gift-display";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const claimed = await db
    .insert(webhookEventLog)
    .values({
      stripeEventId: event.id,
      eventType: event.type,
      status: "claimed",
    })
    .onConflictDoNothing();

  if (claimed.rowsAffected === 0) {
    const existing = await db
      .select({ status: webhookEventLog.status })
      .from(webhookEventLog)
      .where(eq(webhookEventLog.stripeEventId, event.id));

    if (existing[0]?.status === "processed") {
      return NextResponse.json({ received: true });
    }
    // status is "claimed" from a prior failed attempt — allow re-processing
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
    }
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  await db
    .update(webhookEventLog)
    .set({ status: "processed", processedAt: sql`datetime('now')` })
    .where(eq(webhookEventLog.stripeEventId, event.id));

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const giftId = await updateContributionStatus(session);
  if (!giftId) return;

  // CAS-claim the notifications so Stripe redeliveries don't re-send emails.
  // Independent from status flip because the /gift success page can call
  // fulfillCheckoutSession and mark status=succeeded before the webhook arrives.
  const claim = await db
    .update(contributions)
    .set({ notificationsSentAt: sql`datetime('now')` })
    .where(and(
      eq(contributions.stripeCheckoutSessionId, session.id),
      isNull(contributions.notificationsSentAt)
    ));

  if (claim.rowsAffected === 0) return;

  await sendContributionNotifications(session, giftId);
}

async function updateContributionStatus(session: Stripe.Checkout.Session): Promise<string | null> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const contributorEmail = session.customer_details?.email || null;

  const contribution = await db
    .select({
      gift_id: contributions.giftId,
      status: contributions.status,
    })
    .from(contributions)
    .where(eq(contributions.stripeCheckoutSessionId, session.id));

  if (contribution.length === 0) {
    console.error(`No contribution found for checkout session ${session.id}`);
    return null;
  }

  const { gift_id, status } = contribution[0];

  if (status !== "succeeded") {
    const updateResult = await db
      .update(contributions)
      .set({
        status: "succeeded" as const,
        stripePaymentIntentId: paymentIntentId || null,
        updatedAt: sql`datetime('now')`,
        ...(contributorEmail ? { contributorEmail } : {}),
      })
      .where(and(
        eq(contributions.stripeCheckoutSessionId, session.id),
        ne(contributions.status, "succeeded")
      ));

    if (updateResult.rowsAffected > 0) {
      await recalculateGiftTotal(gift_id!);
    }
  } else if (contributorEmail) {
    await db
      .update(contributions)
      .set({ contributorEmail, updatedAt: sql`datetime('now')` })
      .where(and(
        eq(contributions.stripeCheckoutSessionId, session.id),
        isNull(contributions.contributorEmail)
      ));
  }

  return gift_id;
}

async function sendContributionNotifications(session: Stripe.Checkout.Session, giftId: string) {
  const contributorEmail = session.customer_details?.email || null;

  try {
    const emailData = await db
      .select({
        contributor_name: contributions.contributorName,
        contributor_note: contributions.contributorNote,
        amount_cents: contributions.amountCents,
        title: gifts.title,
        og_title: gifts.ogTitle,
        total_contributed_cents: gifts.totalContributedCents,
        target_amount_cents: gifts.targetAmountCents,
        gift_id: gifts.id,
        fully_funded_notified: gifts.fullyFundedNotified,
        organizer_name: users.name,
        organizer_email: users.email,
      })
      .from(contributions)
      .innerJoin(gifts, eq(gifts.id, contributions.giftId))
      .innerJoin(users, eq(users.id, gifts.userId))
      .where(eq(contributions.stripeCheckoutSessionId, session.id));

    const row = emailData[0];
    if (row?.organizer_email) {
      await sendContributionEmail({
        organizerEmail: row.organizer_email as string,
        organizerName: row.organizer_name as string,
        giftTitle: giftDisplayTitle(row.og_title as string | null, row.title as string),
        contributorName: row.contributor_name as string | null,
        amountCents: row.amount_cents as number,
        contributorNote: row.contributor_note as string | null,
        totalContributedCents: row.total_contributed_cents as number,
        targetAmountCents: row.target_amount_cents as number,
        giftUrl: `${BASE_URL}/dashboard/gifts/${row.gift_id}`,
      });
    }

    if (contributorEmail && row) {
      await sendContributorReceiptEmail({
        contributorEmail,
        contributorName: row.contributor_name as string | null,
        organizerName: row.organizer_name as string | null,
        giftTitle: giftDisplayTitle(row.og_title as string | null, row.title as string),
        amountCents: row.amount_cents as number,
        totalContributedCents: row.total_contributed_cents as number,
        targetAmountCents: row.target_amount_cents as number,
        giftUrl: `${BASE_URL}/gift/${row.gift_id}`,
      });
    }

    await checkFullyFunded(giftId, row);
  } catch (emailError) {
    console.error("Failed to send contribution email:", emailError);
  }
}

async function checkFullyFunded(giftId: string, row: Record<string, unknown> | undefined) {
  if (
    !row ||
    (row.total_contributed_cents as number) < (row.target_amount_cents as number) ||
    (row.fully_funded_notified as number)
  ) return;

  const flagResult = await db
    .update(gifts)
    .set({ fullyFundedNotified: 1, fullyFundedAt: sql`datetime('now')` })
    .where(and(eq(gifts.id, giftId), eq(gifts.fullyFundedNotified, 0)));

  if (flagResult.rowsAffected === 0) return;

  const allContributors = await db
    .select({
      contributor_email: contributions.contributorEmail,
      contributor_name: contributions.contributorName,
    })
    .from(contributions)
    .where(and(
      eq(contributions.giftId, giftId),
      eq(contributions.status, "succeeded"),
      sql`${contributions.contributorEmail} IS NOT NULL`
    ));

  const giftUrl = `${BASE_URL}/gift/${giftId}`;
  const giftTitle = giftDisplayTitle(row.og_title as string | null, row.title as string);

  for (const c of allContributors) {
    try {
      await sendFullyFundedEmail({
        contributorEmail: c.contributor_email as string,
        contributorName: c.contributor_name as string | null,
        giftTitle,
        giftUrl,
      });
    } catch (e) {
      console.error("Failed to send fully-funded email:", e);
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const result = await db
    .update(contributions)
    .set({ status: "succeeded", updatedAt: sql`datetime('now')` })
    .where(and(
      eq(contributions.stripePaymentIntentId, paymentIntent.id),
      ne(contributions.status, "succeeded")
    ))
    .returning({ gift_id: contributions.giftId });

  if (result.length > 0) {
    await recalculateGiftTotal(result[0].gift_id);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await db
    .update(contributions)
    .set({ status: "failed", updatedAt: sql`datetime('now')` })
    .where(and(
      eq(contributions.stripePaymentIntentId, paymentIntent.id),
      ne(contributions.status, "succeeded")
    ));
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const result = await db
    .update(contributions)
    .set({ status: "refunded", updatedAt: sql`datetime('now')` })
    .where(and(
      eq(contributions.stripePaymentIntentId, paymentIntentId),
      ne(contributions.status, "refunded")
    ))
    .returning({ gift_id: contributions.giftId });

  if (result.length > 0) {
    await recalculateGiftTotal(result[0].gift_id);
    await maybeResetFullyFundedFlag(result[0].gift_id);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

  if (!paymentIntentId) return;

  const result = await db
    .update(contributions)
    .set({ status: "disputed", updatedAt: sql`datetime('now')` })
    .where(and(
      eq(contributions.stripePaymentIntentId, paymentIntentId),
      ne(contributions.status, "disputed")
    ))
    .returning({ gift_id: contributions.giftId });

  if (result.length > 0) {
    await recalculateGiftTotal(result[0].gift_id);
    await maybeResetFullyFundedFlag(result[0].gift_id);
  }
}

// If a refund / dispute drops a previously fully-funded gift back below its
// target, clear the notification flag so that if new contributions later
// cross the goal again we re-send the "pool is full" email.
async function maybeResetFullyFundedFlag(giftId: string) {
  await db
    .update(gifts)
    .set({ fullyFundedNotified: 0, fullyFundedAt: null })
    .where(and(
      eq(gifts.id, giftId),
      eq(gifts.fullyFundedNotified, 1),
      sql`${gifts.totalContributedCents} < ${gifts.targetAmountCents}`,
    ));
}

async function handleAccountUpdated(account: Stripe.Account) {
  await syncStripeAccountStatus(account, { stripeAccountId: account.id });
}
