import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LandingAuth } from "@/components/landing-auth";
import { listOccasions } from "@/data/occasions";
import { breadcrumbSchema } from "@/lib/seo";

const TITLE = "Group gifts by occasion — Giftaro";
const DESCRIPTION =
  "Browse group-gift guides for every occasion: kid birthday parties, milestone birthdays, weddings, baby showers, teacher gifts, and more. Pool one real gift instead of a stack of small ones.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/group-gift" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/group-gift",
    siteName: "Giftaro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function GroupGiftIndex() {
  const occasions = listOccasions();
  if (occasions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader logoHref="/" />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Group gifts
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            More guides landing soon.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Group gifts", url: "/group-gift" },
        ])}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Group gifts", href: "/group-gift" },
          ]}
        />

        <header className="mt-6 mb-8">
          <h1 className="text-balance text-3xl font-bold leading-[1.15] text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Group gifts by occasion
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
            Pool one great gift instead of a stack of small ones. Pick an occasion below.
          </p>
        </header>

        <ul className="space-y-4">
          {occasions.map((o) => (
            <li
              key={o.slug}
              className="rounded-xl border border-zinc-200 bg-white/70 p-4 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <Link
                href={`/group-gift/${o.slug}`}
                className="block text-zinc-900 dark:text-zinc-50"
              >
                <p className="font-semibold leading-snug">{o.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {o.shortDescription}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-12 rounded-2xl border border-zinc-200 bg-white/70 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="mb-2 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Skip the pile of stuff. Get one great gift.
          </p>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            Name your gift. Share the link. Everyone chips in.
          </p>
          <div className="flex justify-center">
            <Suspense fallback={null}>
              <LandingAuth variant="primary" />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
