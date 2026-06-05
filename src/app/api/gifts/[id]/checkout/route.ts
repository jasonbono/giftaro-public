import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { db } from "@/lib/drizzle";
import { gifts, users, contributions } from "@/lib/drizzle-schema";
import { eq, and, isNull } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

import { createCheckoutSession, getAccount, retrieveCheckoutSession } from "@/lib/stripe";
import { syncStripeAccountStatus, enforceAutoClose } from "@/lib/gifts";
import { giftDisplayTitle } from "@/lib/gift-display";
import { isAllowedOwnBlobUrl } from "@/lib/image";

export const dynamic = "force-dynamic";

// How long a cached Stripe account status is trusted before we re-verify.
const STRIPE_STATUS_STALE_MS = 15 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(`checkout:${getClientIp(request)}`, 10);
    if (limited) return limited;
    const { id } = await params;
    const body = await request.json();
    const { amount_cents, contributor_name, contributor_note, contributor_image_url, idempotency_key } = body;
    const authSession = await getSession();
    const userId = authSession?.user?.id || null;

    if (typeof amount_cents !== "number" || !Number.isInteger(amount_cents) || amount_cents < 100 || amount_cents > 1000000) {
      return NextResponse.json({ error: "Contribution must be between $1 and $10,000" }, { status: 400 });
    }

    if (contributor_name && typeof contributor_name === "string" && contributor_name.length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (contributor_note && typeof contributor_note === "string" && contributor_note.length > 500) {
      return NextResponse.json({ error: "Note is too long" }, { status: 400 });
    }

    // Only accept relative paths (stock images shipped with the app) or URLs
    // hosted on our own Vercel Blob. An arbitrary attacker URL here would be
    // embedded in <img src> on every public gift page, leaking visitor IPs /
    // referrers to the attacker and giving them swap-at-will control over
    // the image content.
    if (contributor_image_url != null) {
      if (typeof contributor_image_url !== "string" || contributor_image_url.length > 500) {
        return NextResponse.json({ error: "Invalid image" }, { status: 400 });
      }
      if (contributor_image_url.length > 0 && !isAllowedOwnBlobUrl(contributor_image_url)) {
        return NextResponse.json({ error: "Invalid image" }, { status: 400 });
      }
    }

    const idempotencyKey =
      typeof idempotency_key === "string" && idempotency_key.length > 0 && idempotency_key.length <= 100
        ? idempotency_key
        : null;

    await enforceAutoClose(id);

    const gift = await db.select({
      id: gifts.id,
      title: gifts.title,
      og_title: gifts.ogTitle,
      organizerName: gifts.organizerName,
      status: gifts.status,
      stripeAccountId: users.stripeAccountId,
      chargesEnabled: users.chargesEnabled,
      stripeStatusSyncedAt: users.stripeStatusSyncedAt,
      testMode: users.testMode,
      userName: users.name,
    })
      .from(gifts)
      .innerJoin(users, eq(users.id, gifts.userId))
      .where(and(eq(gifts.id, id), isNull(gifts.trashedAt)));

    if (gift.length === 0) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    const g = gift[0];
    const testMode = !!g.testMode;

    // If the client retried (flaky network) we've already created a Stripe
    // session for this intent. Return its URL instead of creating a duplicate.
    if (idempotencyKey) {
      const existing = await db
        .select({
          stripeCheckoutSessionId: contributions.stripeCheckoutSessionId,
          giftId: contributions.giftId,
        })
        .from(contributions)
        .where(eq(contributions.idempotencyKey, idempotencyKey));
      if (existing.length > 0 && existing[0].giftId === id && existing[0].stripeCheckoutSessionId) {
        try {
          const prior = await retrieveCheckoutSession(existing[0].stripeCheckoutSessionId, testMode);
          if (prior.url) return NextResponse.json({ url: prior.url });
        } catch (e) {
          console.error("Failed to retrieve prior checkout session for idempotent request:", e);
        }
      }
    }

    if (g.status !== "open") {
      return NextResponse.json({ error: "This gift is no longer accepting contributions" }, { status: 400 });
    }

    if (!g.stripeAccountId) {
      return NextResponse.json({ error: "Payments not yet enabled for this gift" }, { status: 400 });
    }

    // Cheap reconciliation: if our cached Stripe account status is stale,
    // re-fetch before trusting chargesEnabled. Stripe can disable charges
    // on Express accounts (compliance/ID holds) and the account.updated
    // webhook is not guaranteed to land in time. Capped by staleness
    // threshold so we don't hit Stripe on every checkout.
    // SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS" (UTC, no timezone);
    // normalize to ISO before parsing to be engine-independent.
    const syncedAt = g.stripeStatusSyncedAt
      ? Date.parse(`${g.stripeStatusSyncedAt.replace(" ", "T")}Z`)
      : 0;
    const isStale = !syncedAt || Date.now() - syncedAt > STRIPE_STATUS_STALE_MS;
    let chargesEnabled = !!g.chargesEnabled;
    if (isStale) {
      try {
        const account = await getAccount(g.stripeAccountId as string, testMode);
        await syncStripeAccountStatus(account, { stripeAccountId: g.stripeAccountId as string });
        chargesEnabled = !!account.charges_enabled;
      } catch (e) {
        console.error("Pre-checkout account re-verify failed; falling back to cached flag:", e);
      }
    }

    if (!chargesEnabled) {
      return NextResponse.json({ error: "This organizer can't accept payments right now. Please reach out to them." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;

    let session;
    try {
      session = await createCheckoutSession({
        giftId: id,
        title: giftDisplayTitle(g.og_title as string | null, g.title as string),
        organizerName: (g.organizerName as string | null) || (g.userName as string | null) || "the organizer",
        amountCents: amount_cents,
        currency: "usd",
        stripeAccountId: g.stripeAccountId as string,
        successUrl: `${origin}/gift/${id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/gift/${id}`,
        testMode,
      });
    } catch (stripeError) {
      // If Stripe rejected the session, our cached chargesEnabled may be stale
      // (common for new Express accounts on compliance / identity holds).
      // Re-verify with Stripe and re-sync the DB so future requests reflect reality.
      const se = stripeError as { type?: string; code?: string; message?: string };
      if (se?.type === "StripeInvalidRequestError" || se?.type === "StripePermissionError") {
        try {
          const account = await getAccount(g.stripeAccountId as string, testMode);
          await syncStripeAccountStatus(account, { stripeAccountId: g.stripeAccountId as string });
          if (!account.charges_enabled) {
            console.error("STALE_CHARGES_ENABLED", {
              stripeAccountId: g.stripeAccountId,
              giftId: id,
              dbChargesEnabled: g.chargesEnabled,
              liveChargesEnabled: account.charges_enabled,
              stripeErrorCode: se?.code,
              stripeErrorMessage: se?.message,
            });
            return NextResponse.json(
              { error: "This organizer can't accept payments right now. Please reach out to them." },
              { status: 400 }
            );
          }
        } catch (recheckError) {
          console.error("Failed to re-verify Stripe account on checkout error:", recheckError);
        }
      }
      throw stripeError;
    }

    try {
      await db.insert(contributions)
        .values({
          giftId: id,
          amountCents: amount_cents,
          currency: "usd",
          contributorName: contributor_name || null,
          contributorNote: contributor_note || null,
          contributorImageUrl: contributor_image_url || null,
          contributorUserId: userId || null,
          status: "pending",
          stripeCheckoutSessionId: session.id,
          idempotencyKey: idempotencyKey,
        });
    } catch (insertError) {
      // Unique-constraint race: a concurrent request with the same
      // idempotency key won the insert. Return its session URL.
      if (idempotencyKey) {
        const existing = await db
          .select({ stripeCheckoutSessionId: contributions.stripeCheckoutSessionId })
          .from(contributions)
          .where(eq(contributions.idempotencyKey, idempotencyKey));
        if (existing[0]?.stripeCheckoutSessionId) {
          try {
            const prior = await retrieveCheckoutSession(existing[0].stripeCheckoutSessionId, testMode);
            if (prior.url) return NextResponse.json({ url: prior.url });
          } catch {}
        }
      }
      throw insertError;
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const e = error as { message?: string; code?: string; type?: string; statusCode?: number; stack?: string; cause?: { message?: string; code?: string; rawCode?: number } };
    const causeInfo = e?.cause
      ? { message: e.cause.message, code: e.cause.code, rawCode: e.cause.rawCode }
      : undefined;
    console.error("Checkout error:", {
      message: e?.message,
      code: e?.code,
      type: e?.type,
      statusCode: e?.statusCode,
      cause: causeInfo,
      stack: e?.stack,
    });
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
