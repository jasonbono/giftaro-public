import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { AppHeader } from "@/components/app-header";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  guideSlugs,
  loadGuide,
  listGuides,
  type GuideSummary,
} from "@/lib/content";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await guideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) return {};
  return {
    title: `${guide.title} — Giftaro`,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `/guides/${guide.slug}`,
      siteName: "Giftaro",
      type: "article",
      publishedTime: guide.date,
      modifiedTime: guide.updated ?? guide.date,
      authors: guide.author ? [guide.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) notFound();

  const all = await listGuides();
  const related: GuideSummary[] = (guide.related ?? [])
    .map((s) => all.find((g) => g.slug === s))
    .filter((g): g is GuideSummary => Boolean(g));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <JsonLd
        data={[
          articleSchema({
            title: guide.title,
            description: guide.description,
            url: `/guides/${guide.slug}`,
            datePublished: guide.date,
            dateModified: guide.updated,
            author: guide.author,
            image: guide.image,
          }),
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Guides", url: "/guides" },
            { name: guide.title, url: `/guides/${guide.slug}` },
          ]),
        ]}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Guides", href: "/guides" },
            { name: guide.title, href: `/guides/${guide.slug}` },
          ]}
        />
        <article className="mt-6">
          <header className="mb-8">
            <h1 className="text-balance text-3xl font-bold leading-[1.15] text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {guide.title}
            </h1>
            <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
              {guide.description}
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-zinc-400">
              {new Date(guide.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {guide.author ? ` · ${guide.author}` : ""}
            </p>
          </header>
          <div className="prose-giftaro space-y-4 text-[0.975rem] leading-relaxed text-zinc-700 dark:text-zinc-200">
            <MDXRemote source={guide.body} />
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Related
            </h2>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/guides/${r.slug}`}
                    className="text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                  >
                    {r.title}
                  </Link>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {r.description}
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
