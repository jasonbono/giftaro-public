import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { listGuides } from "@/lib/content";
import { breadcrumbSchema } from "@/lib/seo";

const TITLE = "Guides — Giftaro";
const DESCRIPTION =
  "Group-gift guides: how-tos, etiquette, how-much-to-contribute, organizer tips, and more.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/guides",
    siteName: "Giftaro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function GuidesIndex() {
  const guides = await listGuides();
  if (guides.length === 0) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Guides", url: "/guides" },
        ])}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Guides", href: "/guides" },
          ]}
        />
        <header className="mt-6 mb-8">
          <h1 className="text-balance text-3xl font-bold leading-[1.15] text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Guides
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
            {DESCRIPTION}
          </p>
        </header>

        <ul className="space-y-4">
          {guides.map((g) => (
            <li
              key={g.slug}
              className="rounded-xl border border-zinc-200 bg-white/70 p-4 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <Link href={`/guides/${g.slug}`} className="block text-zinc-900 dark:text-zinc-50">
                <p className="font-semibold leading-snug">{g.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {g.description}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-400">
                  {new Date(g.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
