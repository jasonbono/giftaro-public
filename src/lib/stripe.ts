import Stripe from "stripe";
import { db } from "./drizzle";
import { contributions, gifts, users } from "./drizzle-schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { STRIPE_FIXED_FEE_CENTS, STRIPE_PERCENT_RETAINED } from "./constants";
import { recalculateGiftTotal } from "./gifts";

const apiVersion = "2026-02-25.clover" as const;

let liveClient: Stripe | null = null;
let testClient: Stripe | null = null;

export function stripe(testMode: boolean): Stripe {
  if (testMode) {
    if (!testClient) {
      const key = process.env.STRIPE_SECRET_KEY_TEST;
      if (!key) throw new Error("STRIPE_SECRET_KEY_TEST is not configured");
      testClient = new Stripe(key, { apiVersion });
    }
    return testClient;
  }
  if (!liveClient) {
    liveClient = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion });
  }
  return liveClient;
}

export async function createConnectedAccount(userId: string, email: string, name: string, testMode: boolean) {
  const trimmed = (name || "").trim();
  const [firstName, ...rest] = trimmed.split(/\s+/);
  const lastName = rest.join(" ");
  return stripe(testMode).accounts.create({
    type: "express",
    country: "US",
    email,
    business_type: "individual",
    business_profile: {
      mcc: "7299",
      product_description: "Collecting contributions from friends and family for a group gift.",
      url: "https://giftaro.app",
      name: trimmed || "Giftaro organizer",
    },
    individual: {
      email,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
    },
    settings: {
      payments: { statement_descriptor: "GIFTARO" },
    },
    metadata: { giftaro_user_id: userId },
  }, {
    idempotencyKey: `connect_account_${userId}`,
  });
}

export async function createAccountLink(
  stripeAccountId: string,
  returnUrl: string,
  refreshUrl: string,
  testMode: boolean
) {
  return stripe(testMode).accountLinks.create({
    account: stripeAccountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
}

export async function createCheckoutSession(params: {
  giftId: string;
  title: string;
  organizerName: string;
  amountCents: number;
  currency: string;
  stripeAccountId: string;
  successUrl: string;
  cancelUrl: string;
  testMode: boolean;
}) {
  // Reverse the fee so the organizer receives exactly amountCents after Stripe's cut
  const totalChargeCents = Math.round(
    (params.amountCents + STRIPE_FIXED_FEE_CENTS) / STRIPE_PERCENT_RETAINED
  );
  const applicationFeeCents = totalChargeCents - params.amountCents;

  const firstName = params.organizerName.trim().split(/\s+/)[0] || "the organizer";
  const amountDisplay = params.amountCents % 100 === 0
    ? `$${params.amountCents / 100}`
    : `$${(params.amountCents / 100).toFixed(2)}`;

  return stripe(params.testMode).checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: params.currency,
          product_data: { name: `Chip in to ${params.title}` },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: params.currency,
          product_data: { name: "Processing fee" },
          unit_amount: applicationFeeCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: params.stripeAccountId },
    },
    custom_text: {
      submit: {
        message: `All ${amountDisplay} goes directly to ${firstName}.\nOrganized on Giftaro.`,
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { gift_id: params.giftId },
  });
}

export async function getAccount(stripeAccountId: string, testMode: boolean) {
  return stripe(testMode).accounts.retrieve(stripeAccountId);
}

export async function retrieveCheckoutSession(sessionId: string, testMode: boolean) {
  return stripe(testMode).checkout.sessions.retrieve(sessionId);
}

export async function createDashboardLoginLink(stripeAccountId: string, testMode: boolean) {
  return stripe(testMode).accounts.createLoginLink(stripeAccountId);
}

// Verifies the webhook signature against every configured signing secret.
// Stripe's Event Destinations UI forces one scope per destination ("your
// account" vs "connected accounts"), so a Connect platform needs TWO live
// destinations pointing at the same URL, each with its own secret. Same for
// test mode. event.livemode on the returned object tells us which client to
// use for any follow-up API calls.
export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const liveSecrets = [
    { secret: process.env.STRIPE_WEBHOOK_SECRET, testMode: false },
    { secret: process.env.STRIPE_WEBHOOK_SECRET_CONNECT, testMode: false },
    { secret: process.env.STRIPE_WEBHOOK_SECRET_TEST, testMode: true },
    { secret: process.env.STRIPE_WEBHOOK_SECRET_TEST_CONNECT, testMode: true },
  ].filter((s): s is { secret: string; testMode: boolean } => !!s.secret);

  if (liveSecrets.length === 0) {
    throw new Error("No Stripe webhook secret configured");
  }

  let lastError: unknown = null;
  for (const { secret, testMode } of liveSecrets) {
    try {
      return stripe(testMode).webhooks.constructEvent(body, signature, secret);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export type FulfillResult = { verified: true; amountCents: number } | { verified: false };

export async function fulfillCheckoutSession(
  sessionId: string,
  giftId: string
): Promise<FulfillResult> {
  const contribution = await db
    .select({
      id: contributions.id,
      status: contributions.status,
      amountCents: contributions.amountCents,
      testMode: users.testMode,
    })
    .from(contributions)
    .innerJoin(gifts, eq(gifts.id, contributions.giftId))
    .innerJoin(users, eq(users.id, gifts.userId))
    .where(and(eq(contributions.stripeCheckoutSessionId, sessionId), eq(contributions.giftId, giftId)));

  if (contribution.length === 0) return { verified: false };

  const row = contribution[0];
  if (row.status === "succeeded") return { verified: true, amountCents: row.amountCents as number };

  try {
    const session = await stripe(!!row.testMode).checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return { verified: false };

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const updateResult = await db
      .update(contributions)
      .set({
        status: "succeeded",
        stripePaymentIntentId: paymentIntentId || null,
        updatedAt: sql`datetime('now')`,
      })
      .where(and(eq(contributions.stripeCheckoutSessionId, sessionId), ne(contributions.status, "succeeded")));

    if (updateResult.rowsAffected > 0) {
      await recalculateGiftTotal(giftId);
    }

    return { verified: true, amountCents: row.amountCents as number };
  } catch (error) {
    console.error("Failed to fulfill checkout session:", error);
    return { verified: false };
  }
}
