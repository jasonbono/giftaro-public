"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CardWall } from "@/app/gift/[id]/card-wall";
import { ContributeForm } from "@/app/gift/[id]/contribute-form";
import { ContributeAnchor } from "@/app/gift/[id]/contribute-anchor";
import { ShareActions } from "./share-actions";
import { ReopenGiftButton } from "./reopen-gift";
import { ShareRevealButton } from "./share-reveal";
import { Confetti } from "@/components/confetti";
import { FundedCelebration } from "@/components/funded-celebration";
import { BankLinkedBanner } from "@/components/bank-linked-banner";
import { ActivationChecklist } from "@/components/activation-checklist";
import { GiftImage } from "@/components/gift-image";
import { AppHeader } from "@/components/app-header";
import Link from "next/link";
import { GiftProgress } from "@/components/gift-progress";
import { OrganizerCard } from "@/components/organizer-card";
import { InViewProvider } from "@/components/in-view-observer";
import { giftDisplayTitle } from "@/lib/gift-display";
import { getOnboardingState } from "@/lib/onboarding-state";
import { calcProgress } from "@/lib/progress";

type Gift = {
  id: string;
  title: string;
  description: string | null;
  organizer_name: string | null;
  target_amount_cents: number;
  total_contributed_cents: number;
  status: string;
  og_image: string | null;
  og_title: string | null;
  charges_enabled: number;
  details_submitted: number;
  stripe_account_id: string | null;
  image_zoom: number;
  image_offset_x: number;
  image_offset_y: number;
};

type ContributionRow = {
  id: string;
  contributor_name: string | null;
  contributor_note: string | null;
  contributor_image_url: string | null;
  amount_cents: number;
  reactions: Record<string, number>;
  userReactions: string[];
};

export function GiftDetailView({
  gift,
  contributions,
  organizerName,
  currentUserId,
  hasReceivedAnyContribution = false,
}: {
  gift: Gift;
  contributions: ContributionRow[];
  organizerName: string | null;
  currentUserId: string;
  hasReceivedAnyContribution?: boolean;
}) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";
  const [view, setView] = useState<"my-view" | "friends-view">("my-view");

  const [allRevealed, setAllRevealed] = useState(false);

  const progress = calcProgress(gift.total_contributed_cents, gift.target_amount_cents);
  const isFullyFunded = progress >= 100;
  const isActive = !!gift.charges_enabled;
  const displayTitle = giftDisplayTitle(gift.og_title, gift.title);
  const cards = contributions.map((c) => ({
    id: c.id,
    contributor_name: c.contributor_name,
    contributor_note: c.contributor_note,
    contributor_image_url: c.contributor_image_url,
    reactions: c.reactions,
    userReactions: c.userReactions,
  }));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {justCreated && <Confetti />}
      {!justCreated && isFullyFunded && <FundedCelebration giftId={gift.id} />}
      <AppHeader inlineNav>
        <div className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          <button
            onClick={() => setView("my-view")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "my-view"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            My View
          </button>
          <button
            onClick={() => setView("friends-view")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "friends-view"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            Friends View
          </button>
        </div>
        {gift.status === "open" && (
          <Link
            href={`/dashboard/gifts/${gift.id}/edit`}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Link>
        )}
        {gift.status === "closed" && (
          <ReopenGiftButton giftId={gift.id} />
        )}
      </AppHeader>

      <div className="mx-auto w-full max-w-2xl px-6 pt-4 empty:hidden">
        <BankLinkedBanner message="Bank linked — you're ready to share." suppress={hasReceivedAnyContribution} />
      </div>

      {!isActive ? (
        <PreActivationView
          gift={gift}
          displayTitle={displayTitle}
          organizerName={organizerName}
          view={view}
        />
      ) : (
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
          {gift.status === "closed" ? (
            <ShareRevealButton giftId={gift.id} />
          ) : (
            <div className="flex flex-col gap-3">
              {justCreated && (
                <div className="rounded-2xl bg-zinc-50 px-5 py-4 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    You&apos;re all set.
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    People want to chip in — share the link and let them.
                  </p>
                </div>
              )}
              <ShareActions giftId={gift.id} giftTitle={displayTitle} />
            </div>
          )}

          {view === "my-view" ? (
            <>
              <div>
                <div className="mb-4 overflow-hidden rounded-xl">
                  <GiftImage
                    src={gift.og_image}
                    alt={gift.og_title || ""}
                    title={displayTitle}
                    zoom={gift.image_zoom}
                    offsetX={gift.image_offset_x}
                    offsetY={gift.image_offset_y}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {displayTitle}
                  </h1>
                  {isFullyFunded && (
                    <span className="progress-shimmer rounded-full px-3 py-1 text-xs font-medium !text-white">
                      Fully funded
                    </span>
                  )}
                </div>
                {gift.description && (
                  <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                    {gift.description}
                  </p>
                )}
              </div>

              <div>
                <GiftProgress
                  totalContributedCents={gift.total_contributed_cents}
                  targetAmountCents={gift.target_amount_cents}
                  contributorCount={contributions.length}
                  contributors={contributions.map((c) => ({
                    image_url: c.contributor_image_url,
                    name: c.contributor_name,
                  }))}
                />
                {organizerName && (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Organized by {organizerName}
                  </p>
                )}
              </div>

              <div>
                {contributions.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 rounded-2xl bg-zinc-50 px-4 py-10 text-center dark:bg-zinc-900">
                    <img src="/gift_red.png" alt="" className="h-12 w-12 opacity-60" />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">No one&apos;s chipped in yet</p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Share the link — they&apos;re waiting to be asked.</p>
                    </div>
                    <div className="w-full">
                      <ShareActions giftId={gift.id} giftTitle={displayTitle} />
                    </div>
                  </div>
                ) : (
                  <>
                    <InViewProvider>
                      <div className="grid grid-cols-2 gap-3">
                        {contributions.map((c, i) => (
                          <OrganizerCard
                            key={c.id}
                            contribution={c}
                            index={i}
                            flipped={allRevealed ? true : undefined}
                            currentUserId={currentUserId}
                          />
                        ))}
                      </div>
                    </InViewProvider>
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setAllRevealed((v) => !v)}
                        className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      >
                        {allRevealed ? "Hide amounts" : "Reveal all amounts"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div inert className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col items-center gap-2 px-6 pt-8 text-center">
                <div className="mb-2 w-full overflow-hidden rounded-xl">
                  <GiftImage
                    src={gift.og_image}
                    alt={gift.og_title || ""}
                    title={displayTitle}
                    zoom={gift.image_zoom}
                    offsetX={gift.image_offset_x}
                    offsetY={gift.image_offset_y}
                  />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {displayTitle}
                </h1>
                {gift.description && (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {gift.description}
                  </p>
                )}
              </div>

              <div className="px-6 pt-6">
                <GiftProgress
                  totalContributedCents={gift.total_contributed_cents}
                  targetAmountCents={gift.target_amount_cents}
                  contributorCount={contributions.length}
                  contributors={contributions.map((c) => ({
                    image_url: c.contributor_image_url,
                    name: c.contributor_name,
                  }))}
                />
                {organizerName && (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Organized by {organizerName}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-center px-6">
                <ContributeAnchor />
              </div>
              <div className="mt-8 px-6">
                <ContributeForm giftId={gift.id} />
              </div>

              <div className="px-6 pb-8">
                <CardWall
                  contributions={cards}
                  isLoggedIn={true}
                  currentUserId={currentUserId}
                  returnTo={`/dashboard/gifts/${gift.id}`}
                />
              </div>
            </div>
          )}

          {view === "my-view" && gift.status === "open" && (
            <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              As friends chip in, their contributions immediately land in your Stripe account. Stripe usually takes 2–7 days to transfer to your linked bank account. You always receive the full amount.
            </p>
          )}

        </main>
      )}
    </div>
  );
}

function PreActivationView({
  gift,
  displayTitle,
  organizerName,
  view,
}: {
  gift: Gift;
  displayTitle: string;
  organizerName: string | null;
  view: "my-view" | "friends-view";
}) {
  if (view === "friends-view") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
        <div className="rounded-xl bg-zinc-100/70 px-4 py-3 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Preview</span> — what friends will see once you activate.
        </div>
        <FriendViewPreview
          gift={gift}
          displayTitle={displayTitle}
          organizerName={organizerName}
        />
      </main>
    );
  }

  const onboardingState = getOnboardingState({
    stripeAccountId: gift.stripe_account_id,
    detailsSubmitted: gift.details_submitted,
    chargesEnabled: gift.charges_enabled,
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <ActivationChecklist state={onboardingState} />
      <GiftPreviewCard
        gift={gift}
        displayTitle={displayTitle}
        organizerName={organizerName}
      />
    </main>
  );
}

function GiftPreviewCard({
  gift,
  displayTitle,
  organizerName,
}: {
  gift: Gift;
  displayTitle: string;
  organizerName: string | null;
}) {
  return (
    <Link
      href={`/dashboard/gifts/${gift.id}/edit`}
      className="group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/70 transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:ring-zinc-800 dark:hover:bg-zinc-900"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
        <GiftImage
          src={gift.og_image}
          alt={gift.og_title || ""}
          title={displayTitle}
          className="h-full w-full"
          zoom={gift.image_zoom}
          offsetX={gift.image_offset_x}
          offsetY={gift.image_offset_y}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {displayTitle}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          ${(gift.target_amount_cents / 100).toFixed(0)} goal
          {organizerName ? ` · ${organizerName}` : ""}
        </p>
      </div>
      <span className="text-xs text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
        Edit
      </span>
    </Link>
  );
}

function FriendViewPreview({
  gift,
  displayTitle,
  organizerName,
}: {
  gift: Gift;
  displayTitle: string;
  organizerName: string | null;
}) {
  return (
    <div inert className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-2 px-6 pt-8 text-center">
        <div className="mb-2 w-full overflow-hidden rounded-xl">
          <GiftImage
            src={gift.og_image}
            alt={gift.og_title || ""}
            title={displayTitle}
            zoom={gift.image_zoom}
            offsetX={gift.image_offset_x}
            offsetY={gift.image_offset_y}
          />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {displayTitle}
        </h1>
        {gift.description && (
          <p className="text-zinc-500 dark:text-zinc-400">
            {gift.description}
          </p>
        )}
      </div>

      <div className="px-6 pt-6">
        <GiftProgress
          totalContributedCents={0}
          targetAmountCents={gift.target_amount_cents}
          contributorCount={0}
          contributors={[]}
        />
        {organizerName && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Organized by {organizerName}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-center px-6">
        <ContributeAnchor />
      </div>
      <div className="mt-8 px-6 pb-8">
        <ContributeForm giftId={gift.id} />
      </div>
    </div>
  );
}
