import { getSession } from "@/lib/auth-session";
import { db } from "@/lib/drizzle";
import { gifts, users, contributions, reactions } from "@/lib/drizzle-schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { cache } from "react";
import { GiftProgress } from "@/components/gift-progress";

import { fulfillCheckoutSession } from "@/lib/stripe";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/ui";
import { ContributeForm, ClearContributeDraft } from "./contribute-form";
import { ContributeAnchor } from "./contribute-anchor";
import { CardWall } from "./card-wall";
import { Confetti } from "@/components/confetti";
import { EmailReminder } from "@/components/email-reminder";
import { GiftImage } from "@/components/gift-image";
import { OrganizerBar } from "./organizer-bar";
import { ShareGiftCta, SignUpCta, LoggedInCta, LoggedInFooterCta, ShareGiftaroCta } from "./share-cta";
import { PreActivationFriendView } from "./pre-activation-friend-view";
import { InlineCropEditor } from "./inline-crop-editor";
import { AppHeader } from "@/components/app-header";
import { giftDisplayTitle } from "@/lib/gift-display";
import { getOnboardingState } from "@/lib/onboarding-state";
import { enforceAutoClose } from "@/lib/gifts";
import { calcProgress } from "@/lib/progress";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// Fetches every column generateMetadata() and the page body need in one
// shot, and dedupes across both calls within the same request via React's
// per-request `cache()`. Without this, each page load ran TWO near-identical
// SELECTs on gifts (one for metadata, one for the body).
const getGiftWithUser = cache(async (id: string) => {
  await enforceAutoClose(id);
  const rows = await db
    .select({
      id: gifts.id,
      title: gifts.title,
      description: gifts.description,
      target_amount_cents: gifts.targetAmountCents,
      total_contributed_cents: gifts.totalContributedCents,
      status: gifts.status,
      organizer_name: gifts.organizerName,
      og_image: gifts.ogImage,
      og_title: gifts.ogTitle,
      trashed_at: gifts.trashedAt,
      user_id: gifts.userId,
      user_name: users.name,
      charges_enabled: users.chargesEnabled,
      details_submitted: users.detailsSubmitted,
      stripe_account_id: users.stripeAccountId,
      image_zoom: gifts.imageZoom,
      image_offset_x: gifts.imageOffsetX,
      image_offset_y: gifts.imageOffsetY,
    })
    .from(gifts)
    .innerJoin(users, eq(users.id, gifts.userId))
    .where(eq(gifts.id, id));
  return rows[0] ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {

  const { id } = await params;
  const gift = await getGiftWithUser(id);

  if (!gift) {
    return { title: "Gift not found | Giftaro", robots: { index: false, follow: false } };
  }

  if (gift.trashed_at) {
    return { title: "Gift removed | Giftaro", robots: { index: false, follow: false } };
  }

  const displayTitle = giftDisplayTitle(gift.og_title as string | null, gift.title as string);
  const title = `${displayTitle} | Giftaro`;
  const description =
    (gift.description as string) ||
    `Chip into the pool for ${displayTitle} on Giftaro`;

  const images = gift.og_image
    ? [{ url: gift.og_image as string }]
    : [{ url: "/opengraph-image" }];

  // Individual gift pages carry recipient names, photos, and amounts —
  // keep them out of Google while staying fetchable for iMessage/Slack/X
  // unfurl bots (which ignore the noindex meta).
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Giftaro",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function PublicGiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; session_id?: string; preview?: string }>;
}) {

  const { id } = await params;
  const { success, session_id, preview } = await searchParams;
  const isPreview = preview === "1";

  // First wave: everything that depends only on `id` runs concurrently.
  // contribRows is pre-fetched optimistically — even when the gift turns
  // out to be trashed, the wasted query is cheap compared to the latency
  // we'd otherwise burn on a second round-trip.
  const [session, gift, contribRows, fulfillResult] = await Promise.all([
    getSession(),
    getGiftWithUser(id),
    db
      .select({
        id: contributions.id,
        contributor_name: contributions.contributorName,
        contributor_note: contributions.contributorNote,
        contributor_image_url: contributions.contributorImageUrl,
      })
      .from(contributions)
      .where(and(eq(contributions.giftId, id), eq(contributions.status, "succeeded")))
      .orderBy(desc(contributions.createdAt))
      .limit(200),
    success === "true" && session_id
      ? fulfillCheckoutSession(session_id, id).catch((e) => {
          console.error("fulfillCheckoutSession failed:", e);
          return { verified: false as const };
        })
      : Promise.resolve(null),
  ]);

  if (!gift) notFound();

  const isLoggedIn = !!session;
  const isOrganizer = isLoggedIn && session.user.id === gift.user_id && !isPreview;
  const organizerOnboardingState = isOrganizer
    ? getOnboardingState({
        stripeAccountId: gift.stripe_account_id as string | null,
        detailsSubmitted: gift.details_submitted as number | null,
        chargesEnabled: gift.charges_enabled as number | null,
      })
    : "complete";

  const isVerifiedSuccess = fulfillResult?.verified === true;
  const contributedAmountCents = isVerifiedSuccess ? fulfillResult.amountCents : null;
  const organizerFirst = ((gift?.organizer_name as string | null) || (gift?.user_name as string | null) || "").trim().split(/\s+/)[0];

  if (gift.trashed_at) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <AppHeader logoHref="/" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <img src="/gift_red.png" alt="Gift" className="inline h-10 w-10" />
          <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            This gift page has been removed
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The organizer took this one down — but you can start your own in 60 seconds.
          </p>
          <div className="mt-8">
            {isLoggedIn ? <LoggedInCta /> : <SignUpCta />}
          </div>
        </div>
      </div>
    );
  }

  const contributionIds = contribRows.map((c) => c.id as string);

  const reactionCounts: Record<string, Record<string, number>> = {};
  const userReactions: Record<string, string[]> = {};

  if (contributionIds.length > 0) {
    // Second wave: reaction aggregations depend on contributionIds so they
    // can't fold into the first wave, but counts and the current user's
    // own reactions are independent of each other and run concurrently.
    const [counts, mine] = await Promise.all([
      db
        .select({
          contribution_id: reactions.contributionId,
          reaction_type: reactions.reactionType,
          cnt: sql<number>`COUNT(*)`.as("cnt"),
        })
        .from(reactions)
        .where(inArray(reactions.contributionId, contributionIds))
        .groupBy(reactions.contributionId, reactions.reactionType),
      isLoggedIn
        ? db
            .select({
              contribution_id: reactions.contributionId,
              reaction_type: reactions.reactionType,
            })
            .from(reactions)
            .where(and(
              inArray(reactions.contributionId, contributionIds),
              eq(reactions.userId, session.user.id)
            ))
        : Promise.resolve([] as { contribution_id: string; reaction_type: string }[]),
    ]);

    for (const r of counts) {
      const cid = r.contribution_id as string;
      const rt = r.reaction_type as string;
      if (!reactionCounts[cid]) reactionCounts[cid] = {};
      reactionCounts[cid][rt] = r.cnt as number;
    }

    for (const r of mine) {
      const cid = r.contribution_id as string;
      if (!userReactions[cid]) userReactions[cid] = [];
      userReactions[cid].push(r.reaction_type as string);
    }
  }

  const cards = contribRows.map((c) => ({
    id: c.id as string,
    contributor_name: c.contributor_name as string | null,
    contributor_note: c.contributor_note as string | null,
    contributor_image_url: c.contributor_image_url as string | null,
    reactions: reactionCounts[c.id as string] || {},
    userReactions: userReactions[c.id as string] || [],
  }));

  const isOpen = gift.status === "open";
  const canAcceptPayments = isOpen && !!gift.charges_enabled;
  const isFullyFunded =
    calcProgress(
      gift.total_contributed_cents as number,
      gift.target_amount_cents as number,
    ) >= 100;

  const userName = session?.user?.name || undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!isVerifiedSuccess && isFullyFunded && <Confetti />}
      <AppHeader logoHref="/" />
      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-12">
        {isOrganizer && <OrganizerBar giftId={id} />}

        {/* ── Gift Details ── */}

        <div className="mt-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="mb-2 w-full">
              {isOrganizer && gift.og_image ? (
                <InlineCropEditor
                  giftId={id}
                  src={gift.og_image as string}
                  alt={gift.og_title as string || ""}
                  title={giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
                  initialZoom={(gift.image_zoom as number) ?? 1}
                  initialOffsetX={(gift.image_offset_x as number) ?? 0}
                  initialOffsetY={(gift.image_offset_y as number) ?? 0}
                />
              ) : (
                <div className="overflow-hidden rounded-xl">
                  <GiftImage
                    src={gift.og_image as string | null}
                    alt={gift.og_title as string || ""}
                    title={giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
                    zoom={(gift.image_zoom as number) ?? 1}
                    offsetX={(gift.image_offset_x as number) ?? 0}
                    offsetY={(gift.image_offset_y as number) ?? 0}
                  />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
            </h1>
            {gift.description && (
              <p className="text-zinc-500 dark:text-zinc-400">
                {gift.description as string}
              </p>
            )}
          </div>

          <div className="mt-6">
            {canAcceptPayments && (
              <GiftProgress
                totalContributedCents={gift.total_contributed_cents as number}
                targetAmountCents={gift.target_amount_cents as number}
                contributorCount={contribRows.length}
                contributors={contribRows.map((c) => ({
                  image_url: c.contributor_image_url as string | null,
                  name: c.contributor_name as string | null,
                }))}
              />
            )}
            {(gift.organizer_name || gift.user_name) && (
              <p className={`${canAcceptPayments ? "mt-2" : ""} text-sm text-zinc-500 dark:text-zinc-400`}>
                Organized by {(gift.organizer_name as string | null) ?? (gift.user_name as string)}
              </p>
            )}
          </div>
        </div>

        {/* ── Contribute / status ── */}

        {isVerifiedSuccess ? (
          <div className="mt-8 flex flex-col gap-5">
            <Confetti />
            <ClearContributeDraft giftId={id} />

            {/* ① Payment confirmation — compact, reassuring */}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-5 py-4 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:shadow-emerald-900/20 dark:ring-emerald-900/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                  {contributedAmountCents
                    ? `Cheers! You chipped in $${(contributedAmountCents / 100).toFixed(contributedAmountCents % 100 === 0 ? 0 : 2)}.`
                    : "Cheers! You're in."}
                </p>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70">
                  {(() => {
                    const who = organizerFirst ? `${organizerFirst}'s` : "They've";
                    return `${who} been notified.`;
                  })()}
                </p>
              </div>
            </div>

            {/* ② Conversion CTA — hero, biggest visual weight */}
            {isLoggedIn
              ? <LoggedInCta context="just-contributed" organizerFirstName={organizerFirst} />
              : <SignUpCta context="just-contributed" organizerFirstName={organizerFirst} />}

            {/* ③ Remind me for my own occasion */}
            <EmailReminder source="post_contribution" embedded />

            {/* ④ Spread this gift page */}
            <ShareGiftCta giftTitle={giftDisplayTitle(gift.og_title as string | null, gift.title as string)} />

            {/* ④ Spread Giftaro itself */}
            <ShareGiftaroCta />
          </div>
        ) : canAcceptPayments ? (
          <>
            <div className="mt-6 flex justify-center">
              <ContributeAnchor />
            </div>
            <div id="contribute" className="mt-8 scroll-mt-6">
              <ContributeForm giftId={id} defaultName={userName} />
            </div>
          </>
        ) : isOpen ? (
          isOrganizer ? (
            organizerOnboardingState === "under_review" ? (
              <div className="mt-8 overflow-hidden rounded-2xl bg-zinc-50 p-6 text-center ring-1 ring-zinc-200/60 dark:bg-zinc-900 dark:ring-zinc-800">
                <div className="flex justify-center">
                  <Image
                    src="/gifts_trio.png"
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 opacity-60"
                  />
                </div>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Stripe is reviewing your info
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Usually a few minutes.
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  We&apos;ll update this the moment you&apos;re ready to collect.
                </p>
              </div>
            ) : (
              <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-6 text-center ring-1 ring-emerald-200/60 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-rose-950/40 dark:ring-emerald-900/60">
                <div className="flex justify-center">
                  <Image
                    src="/gifts_trio.png"
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 drop-shadow-lg"
                    style={{ animation: "cta-gift-press 4s ease-in-out infinite" }}
                  />
                </div>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {organizerOnboardingState === "incomplete" ? "Pick up where you left off" : "Ready for friends to chip in?"}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {organizerOnboardingState === "incomplete"
                    ? "Stripe still needs a bit more from you."
                    : "Two-minute setup, then share — every dollar lands in your bank."}
                </p>
                {organizerOnboardingState !== "incomplete" && (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    You only do this once, ever.
                  </p>
                )}
                <ButtonLink
                  href={organizerOnboardingState === "incomplete" ? "/api/stripe/connect/refresh" : `/dashboard/gifts/${id}`}
                  className="mt-5"
                >
                  {organizerOnboardingState === "incomplete" ? "Resume setup" : "Let's go"}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </ButtonLink>
              </div>
            )
          ) : (
            <div className="mt-8">
              <PreActivationFriendView
                giftId={id}
                organizerName={(gift.organizer_name as string | null) ?? (gift.user_name as string) ?? "them"}
                giftTitle={giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
                isLoggedIn={isLoggedIn}
              />
            </div>
          )
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            <div className="rounded-xl border border-zinc-200/70 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-6 text-center shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                This gift is wrapped! 🎀
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {cards.length > 0
                  ? `${cards.length} ${cards.length === 1 ? "person" : "people"} came together to make it happen.`
                  : "The pool\u2019s full \u2014 someone\u2019s about to have the best day."}
              </p>
            </div>
            {isLoggedIn ? <LoggedInCta context="gift-wrapped" /> : <SignUpCta context="gift-wrapped" />}
          </div>
        )}

        {/* ── Activity: Card Wall ── */}

        <CardWall
          contributions={cards}
          highlightFirst={isVerifiedSuccess}
          isLoggedIn={isLoggedIn}
          currentUserId={session?.user?.id ?? null}
          returnTo={`/gift/${id}`}
        />

        {/* ── Remind me (browsing contributors) ── */}

        {!isVerifiedSuccess && !isOrganizer && (
          <div className="mt-8">
            <EmailReminder source="gift_page" embedded />
          </div>
        )}

        {/* ── Footer CTA ── */}

        {!isVerifiedSuccess && isOpen && canAcceptPayments && (
          <>
            {!isOrganizer && (
              <ShareGiftCta
                giftTitle={giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
                variant="compact"
              />
            )}
            {isLoggedIn ? (
              <LoggedInFooterCta />
            ) : (
              <div className="mt-8">
                <SignUpCta />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
