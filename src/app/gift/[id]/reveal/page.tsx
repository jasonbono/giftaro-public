import { db } from "@/lib/drizzle";
import { gifts, users, contributions } from "@/lib/drizzle-schema";
import { eq, and, asc, isNull } from "drizzle-orm";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/ui";
import { GiftImage } from "@/components/gift-image";
import { AppHeader } from "@/components/app-header";
import { giftDisplayTitle } from "@/lib/gift-display";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {

  const { id } = await params;
  const result = await db
    .select({ title: gifts.title, og_title: gifts.ogTitle, og_image: gifts.ogImage })
    .from(gifts)
    .where(and(eq(gifts.id, id), isNull(gifts.trashedAt)));

  if (result.length === 0) return { title: "Gift not found | Giftaro" };
  const gift = result[0];
  const displayTitle = giftDisplayTitle(gift.og_title as string | null, gift.title as string);
  const title = `You got a gift! ${displayTitle}`;
  const description = `Your friends came together to get you ${displayTitle}!`;
  const images = gift.og_image
    ? [{ url: gift.og_image as string }]
    : [{ url: "/opengraph-image" }];
  return {
    title,
    description,
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

export default async function RevealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const result = await db
    .select({
      id: gifts.id,
      title: gifts.title,
      description: gifts.description,
      og_image: gifts.ogImage,
      og_title: gifts.ogTitle,
      image_zoom: gifts.imageZoom,
      image_offset_x: gifts.imageOffsetX,
      image_offset_y: gifts.imageOffsetY,
      trashed_at: gifts.trashedAt,
      organizer_name: gifts.organizerName,
      user_name: users.name,
    })
    .from(gifts)
    .innerJoin(users, eq(users.id, gifts.userId))
    .where(eq(gifts.id, id));

  if (result.length === 0) notFound();
  const gift = result[0];
  if (gift.trashed_at) notFound();

  const contribs = await db
    .select({
      id: contributions.id,
      contributor_name: contributions.contributorName,
      contributor_note: contributions.contributorNote,
      contributor_image_url: contributions.contributorImageUrl,
    })
    .from(contributions)
    .where(and(eq(contributions.giftId, id), eq(contributions.status, "succeeded")))
    .orderBy(asc(contributions.createdAt));

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-brand/5 to-white dark:from-brand/10 dark:to-zinc-950">
      <AppHeader logoHref="/" />
      <div className="mx-auto w-full max-w-md flex-1 px-6 pb-12">
        <div className="mt-4 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-brand">
            Surprise!
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            You got a gift!
          </h1>
          {gift.description && (
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {gift.description as string}
            </p>
          )}
        </div>

        {gift.og_image && (
          <div className="mt-6 overflow-hidden rounded-2xl shadow-lg">
            <GiftImage
              src={gift.og_image as string}
              alt={gift.og_title as string || ""}
              title={giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
              zoom={(gift.image_zoom as number) ?? 1}
              offsetX={(gift.image_offset_x as number) ?? 0}
              offsetY={(gift.image_offset_y as number) ?? 0}
            />
          </div>
        )}

        <h2 className="mt-8 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {giftDisplayTitle(gift.og_title as string | null, gift.title as string)}
        </h2>
        {(gift.organizer_name || gift.user_name) && (
          <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Organized by {(gift.organizer_name as string | null) ?? (gift.user_name as string)}
          </p>
        )}

        {contribs.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {contribs.length} {contribs.length === 1 ? "person" : "people"} made this happen
            </p>
            <div className="flex flex-col gap-3">
              {contribs.map((c) => (
                <div
                  key={c.id as string}
                  className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    {c.contributor_image_url && (
                      <Image
                        src={c.contributor_image_url as string}
                        alt=""
                        width={40}
                        height={40}
                        className={`h-10 w-10 rounded-full ${(c.contributor_image_url as string).startsWith("/stock/") ? "object-contain" : "object-cover"}`}
                      />
                    )}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {(c.contributor_name as string) || "A friend"}
                    </span>
                  </div>
                  {c.contributor_note && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      &ldquo;{c.contributor_note as string}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            Want to return the love?
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Takes 60 seconds. One link, friends chip in.
          </p>
          <ButtonLink href="/sign-up" className="mt-4">
            Create your own gift
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
