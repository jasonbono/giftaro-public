import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { LandingAuth } from "@/components/landing-auth";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getOccasion, listOccasions, occasionSlugs } from "@/data/occasions";
import { breadcrumbSchema, faqSchema, howToSchema } from "@/lib/seo";

export const dynamicParams = false;

export async function generateStaticParams() {
  return occasionSlugs().map((occasion) => ({ occasion }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ occasion: string }>;
}): Promise<Metadata> {
  const { occasion } = await params;
  const o = getOccasion(occasion);
  if (!o) return {};
  return {
    title: `${o.title} — Giftaro`,
    description: o.shortDescription,
    alternates: { canonical: `/group-gift/${o.slug}` },
    openGraph: {
      title: o.title,
      description: o.shortDescription,
      url: `/group-gift/${o.slug}`,
      siteName: "Giftaro",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: o.shortDescription,
    },
  };
}

export default async function OccasionPage({
  params,
}: {
  params: Promise<{ occasion: string }>;
}) {
  const { occasion } = await params;
  const o = getOccasion(occasion);
  if (!o) notFound();

  const all = listOccasions();
  const related = (o.relatedSlugs ?? [])
    .map((s) => all.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Group gifts", url: "/group-gift" },
            { name: o.title, url: `/group-gift/${o.slug}` },
          ]),
          howToSchema({
            name: o.title,
            description: o.shortDescription,
            steps: [
              {
                name: "Name the gift",
                text: "Decide on one specific gift the recipient would actually love. Avoid vague placeholders.",
              },
              {
                name: "Create a Giftaro link",
                text: `Create a Giftaro gift in about 60 seconds with a target around $${o.typicalContribution.lowUsd * 5}–$${o.typicalContribution.highUsd * 10}, depending on group size.`,
              },
              {
                name: "Share the link",
                text: "Send the link by group text, email, or social. Contributors don't need an account to chip in.",
              },
              {
                name: "Buy the gift",
                text: "Funds land in your bank account via Stripe. Buy the gift offline and post a photo back to the page.",
              },
            ],
          }),
          faqSchema([
            {
              question: `How much should each person contribute for a ${o.recipient} ${o.occasion} gift?`,
              answer: `Most groups land between $${o.typicalContribution.lowUsd} and $${o.typicalContribution.highUsd} per person, depending on closeness to the recipient and total group size.`,
            },
            {
              question: "Do contributors need an account?",
              answer:
                "No. Anyone with the link can chip in via credit card. No signup required.",
            },
            {
              question: "Where does the money go?",
              answer:
                "Directly to the organizer's linked bank account via Stripe. There is no escrow or holding period.",
            },
          ]),
        ]}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Group gifts", href: "/group-gift" },
            { name: o.title, href: `/group-gift/${o.slug}` },
          ]}
        />

        <header className="mt-6">
          <h1 className="text-balance text-3xl font-bold leading-[1.15] text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {o.title}
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
            {o.shortDescription}
          </p>
        </header>

        <section className="mt-8 space-y-4 text-[0.975rem] leading-relaxed text-zinc-700 dark:text-zinc-200">
          <p>{o.longDescription}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Typical contribution per person:{" "}
            <strong className="text-zinc-700 dark:text-zinc-200">
              ${o.typicalContribution.lowUsd}–${o.typicalContribution.highUsd}
            </strong>
            .
          </p>
        </section>

        {o.giftIdeas.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Gift ideas
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-200">
              {o.giftIdeas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {o.sampleMessage ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Sample share message
            </h2>
            <blockquote className="rounded-lg border-l-4 border-zinc-300 bg-zinc-50 p-4 italic text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
              &ldquo;{o.sampleMessage}&rdquo;
            </blockquote>
          </section>
        ) : null}

        <section className="mt-12 rounded-2xl border border-zinc-200 bg-white/70 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="mb-2 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Start a Giftaro for this in 60 seconds.
          </p>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            Name the gift. Share the link. Everyone chips in.
          </p>
          <div className="flex justify-center">
            <Suspense fallback={null}>
              <LandingAuth variant="primary" />
            </Suspense>
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Related occasions
            </h2>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/group-gift/${r.slug}`}
                    className="text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                  >
                    {r.title}
                  </Link>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {r.shortDescription}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
