import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/drizzle";
import { users, gifts, contributions } from "@/lib/drizzle-schema";
import { eq, and, isNull, desc } from "drizzle-orm";

import { ensureUser } from "@/lib/user";
import { getOnboardingState } from "@/lib/onboarding-state";
import ManagePayouts from "./manage-payouts";
import GiftCard from "./gift-card";
import { ContributionCard } from "./contribution-card";
import { AppHeader } from "@/components/app-header";
import { BankLinkedBanner } from "@/components/bank-linked-banner";
import { ActivationChecklist } from "@/components/activation-checklist";
import { UserMenu } from "@/components/user-menu";
import { EmailReminder } from "@/components/email-reminder";
import { giftDisplayTitle } from "@/lib/gift-display";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/?returnTo=/dashboard");

  // ensureUser is an upsert; the three reads don't depend on its output,
  // so they can all race against it. The only column the page reads from
  // users is chargesEnabled, which is set by the Stripe onboarding flow and
  // never touched by ensureUser — so even the worst-case ordering
  // (users SELECT wins the race on a first-ever login) produces the same
  // isOnboarded=false result the post-ensureUser read would have.
  const [, userRows, giftRows, myContributions, ownGiftContributions] = await Promise.all([
    ensureUser(
      session.user.id,
      session.user.name || "User",
      session.user.email || null
    ),
    db.select().from(users).where(eq(users.id, session.user.id)),
    db
      .select()
      .from(gifts)
      .where(and(eq(gifts.userId, session.user.id), isNull(gifts.trashedAt)))
      .orderBy(desc(gifts.createdAt))
      .limit(100),
    db
      .select({
        id: contributions.id,
        amount_cents: contributions.amountCents,
        contributor_note: contributions.contributorNote,
        contributor_image_url: contributions.contributorImageUrl,
        gift_id: gifts.id,
        gift_title: gifts.title,
        gift_og_title: gifts.ogTitle,
      })
      .from(contributions)
      .innerJoin(gifts, eq(gifts.id, contributions.giftId))
      .where(and(eq(contributions.contributorUserId, session.user.id), eq(contributions.status, "succeeded")))
      .orderBy(desc(contributions.createdAt))
      .limit(100),
    db
      .select({
        gift_id: contributions.giftId,
        contributor_name: contributions.contributorName,
        contributor_image_url: contributions.contributorImageUrl,
      })
      .from(contributions)
      .innerJoin(gifts, eq(gifts.id, contributions.giftId))
      .where(and(
        eq(gifts.userId, session.user.id),
        isNull(gifts.trashedAt),
        eq(contributions.status, "succeeded"),
      ))
      .orderBy(desc(contributions.createdAt)),
  ]);

  const giftContribs = new Map<string, { count: number; contributors: { image_url: string | null; name: string | null }[] }>();
  for (const r of ownGiftContributions) {
    const giftId = r.gift_id as string;
    const entry = giftContribs.get(giftId) ?? { count: 0, contributors: [] };
    entry.count += 1;
    if (entry.contributors.length < 4) {
      entry.contributors.push({
        image_url: r.contributor_image_url as string | null,
        name: r.contributor_name as string | null,
      });
    }
    giftContribs.set(giftId, entry);
  }

  const dbUser = userRows[0];
  const isOnboarded = !!dbUser?.chargesEnabled;
  const onboardingState = getOnboardingState({
    stripeAccountId: dbUser?.stripeAccountId,
    detailsSubmitted: dbUser?.detailsSubmitted,
    chargesEnabled: dbUser?.chargesEnabled,
  });

  const activeGifts = giftRows.filter((g) => g.status === "open");
  const pastGifts = giftRows.filter((g) => g.status === "closed");
  const hasReceivedAnyContribution = giftRows.some(
    (g) => ((g.totalContributedCents as number | null) ?? 0) > 0
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader inlineNav>
        {isOnboarded && <ManagePayouts />}
        <UserMenu
          userName={session.user.name || "User"}
          userEmail={session.user.email}
        />
      </AppHeader>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <BankLinkedBanner
          message={
            giftRows.length > 0
              ? "Bank linked — you're ready to share."
              : "Bank linked. Now start a gift."
          }
          suppress={hasReceivedAnyContribution}
        />
        <Link
          href="/dashboard/gifts/new"
          className="group relative flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-brand/50 to-emerald-600/90 px-6 py-6 ring-1 ring-emerald-400/30 active:scale-[0.98] dark:from-brand/50 dark:to-emerald-700/90 dark:ring-emerald-500/20"
          style={{ animation: "cta-float 4s ease-in-out infinite" }}
        >
          <Image
            src="/gift_red.png"
            alt=""
            width={72}
            height={72}
            className="drop-shadow-lg group-active:scale-110"
            style={{ animation: "cta-gift-press 4s ease-in-out infinite" }}
          />
          <span className="text-lg font-semibold text-white">
            {giftRows.length > 0 ? "Start a new Gift. Think Big." : "Start a Gift. Think Big."}
          </span>
          <span className="text-sm text-emerald-100">
            Give everyone a way to chip in
          </span>
        </Link>

        {giftRows.length > 0 && onboardingState !== "complete" && (
          <ActivationChecklist state={onboardingState} />
        )}

        {activeGifts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {onboardingState === "complete"
                ? "Active gifts"
                : activeGifts.length === 1
                  ? "Your gift"
                  : "Your gifts"}
            </h2>
            {onboardingState !== "complete" && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Link your bank to share and start collecting.
              </p>
            )}
            <div className="mt-4 flex flex-col gap-4">
              {activeGifts.map((gift) => {
                const c = giftContribs.get(gift.id as string);
                return (
                  <GiftCard
                    key={gift.id as string}
                    id={gift.id as string}
                    title={giftDisplayTitle(gift.ogTitle as string | null, gift.title as string)}
                    totalContributedCents={gift.totalContributedCents as number}
                    targetAmountCents={gift.targetAmountCents as number}
                    imageUrl={gift.ogImage as string | null}
                    dormant={onboardingState !== "complete"}
                    contributorCount={c?.count ?? 0}
                    contributors={c?.contributors ?? []}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeGifts.length === 0 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Active gifts
            </h2>
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              No active gifts yet.
            </p>
          </>
        )}

        {pastGifts.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Past gifts
            </h2>
            <div className="flex flex-col gap-4">
              {pastGifts.map((gift) => {
                const c = giftContribs.get(gift.id as string);
                return (
                  <GiftCard
                    key={gift.id as string}
                    id={gift.id as string}
                    title={giftDisplayTitle(gift.ogTitle as string | null, gift.title as string)}
                    totalContributedCents={gift.totalContributedCents as number}
                    targetAmountCents={gift.targetAmountCents as number}
                    imageUrl={gift.ogImage as string | null}
                    contributorCount={c?.count ?? 0}
                    contributors={c?.contributors ?? []}
                  />
                );
              })}
            </div>
          </>
        )}

        {myContributions.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Your contributions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {myContributions.map((c, i) => (
                <ContributionCard
                  key={c.id as string}
                  giftId={c.gift_id as string}
                  giftTitle={giftDisplayTitle(c.gift_og_title as string | null, c.gift_title as string)}
                  amountCents={c.amount_cents as number}
                  contributorNote={c.contributor_note as string | null}
                  contributorImageUrl={c.contributor_image_url as string | null}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

        <EmailReminder source="dashboard" embedded />
      </main>
    </div>
  );
}
