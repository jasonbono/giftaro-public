import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { db } from "@/lib/drizzle";
import { gifts, users, contributions, reactions } from "@/lib/drizzle-schema";
import { eq, and, isNull, desc, inArray, sql, gt } from "drizzle-orm";

import { Suspense } from "react";
import { GiftDetailView } from "./gift-detail-view";
import { enforceAutoClose } from "@/lib/gifts";

export const dynamic = "force-dynamic";

export default async function GiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/?returnTo=/dashboard/gifts/${encodeURIComponent(id)}`);

  await enforceAutoClose(id);

  // Gift and contributions don't depend on each other — fetch both in
  // one Promise.all wave. The contribs query fires before we've verified
  // the gift belongs to this user, but contribs already filter by giftId
  // so we're not exposing anyone else's data; we just throw the rows away
  // in the (rare) redirect case.
  const [gift, contribs, anyFundedRows] = await Promise.all([
    db
      .select({
        id: gifts.id,
        title: gifts.title,
        description: gifts.description,
        organizer_name: gifts.organizerName,
        target_amount_cents: gifts.targetAmountCents,
        total_contributed_cents: gifts.totalContributedCents,
        status: gifts.status,
        og_image: gifts.ogImage,
        og_title: gifts.ogTitle,
        charges_enabled: users.chargesEnabled,
        details_submitted: users.detailsSubmitted,
        stripe_account_id: users.stripeAccountId,
        user_name: users.name,
        image_zoom: gifts.imageZoom,
        image_offset_x: gifts.imageOffsetX,
        image_offset_y: gifts.imageOffsetY,
      })
      .from(gifts)
      .innerJoin(users, eq(users.id, gifts.userId))
      .where(and(eq(gifts.id, id), eq(gifts.userId, session.user.id), isNull(gifts.trashedAt))),
    db
      .select({
        id: contributions.id,
        contributor_name: contributions.contributorName,
        contributor_note: contributions.contributorNote,
        contributor_image_url: contributions.contributorImageUrl,
        amount_cents: contributions.amountCents,
      })
      .from(contributions)
      .where(and(eq(contributions.giftId, id), eq(contributions.status, "succeeded")))
      .orderBy(desc(contributions.createdAt))
      .limit(500),
    db
      .select({ id: gifts.id })
      .from(gifts)
      .where(and(
        eq(gifts.userId, session.user.id),
        isNull(gifts.trashedAt),
        gt(gifts.totalContributedCents, 0),
      ))
      .limit(1),
  ]);
  const hasReceivedAnyContribution = anyFundedRows.length > 0;

  if (gift.length === 0) redirect("/dashboard");
  const g = gift[0];

  const contributionIds = contribs.map((c) => c.id as string);
  const reactionCounts: Record<string, Record<string, number>> = {};
  const userReactions: Record<string, string[]> = {};

  if (contributionIds.length > 0) {
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
      db
        .select({
          contribution_id: reactions.contributionId,
          reaction_type: reactions.reactionType,
        })
        .from(reactions)
        .where(and(
          inArray(reactions.contributionId, contributionIds),
          eq(reactions.userId, session.user.id)
        )),
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

  return (
    <Suspense>
      <GiftDetailView
      currentUserId={session.user.id}
      gift={{
        id: g.id as string,
        title: g.title as string,
        description: g.description as string | null,
        organizer_name: g.organizer_name as string | null,
        target_amount_cents: g.target_amount_cents as number,
        total_contributed_cents: g.total_contributed_cents as number,
        status: g.status as string,
        og_image: g.og_image as string | null,
        og_title: g.og_title as string | null,
        charges_enabled: g.charges_enabled as number,
        details_submitted: (g.details_submitted as number | null) ?? 0,
        stripe_account_id: g.stripe_account_id as string | null,
        image_zoom: (g.image_zoom as number) ?? 1,
        image_offset_x: (g.image_offset_x as number) ?? 0,
        image_offset_y: (g.image_offset_y as number) ?? 0,
      }}
      contributions={contribs.map((c) => ({
        id: c.id as string,
        contributor_name: c.contributor_name as string | null,
        contributor_note: c.contributor_note as string | null,
        contributor_image_url: c.contributor_image_url as string | null,
        amount_cents: c.amount_cents as number,
        reactions: reactionCounts[c.id as string] || {},
        userReactions: userReactions[c.id as string] || [],
      }))}
      organizerName={(g.organizer_name as string | null) ?? (g.user_name as string | null) ?? null}
      hasReceivedAnyContribution={hasReceivedAnyContribution}
    />
    </Suspense>
  );
}
