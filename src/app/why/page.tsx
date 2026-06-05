import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { LandingAuth } from "@/components/landing-auth";

export const dynamic = "force-dynamic";

const META_TITLE = "Elevate your gifts — Giftaro";
const META_DESCRIPTION =
  "People are elevating their lives with Giftaro. Signs you should too: the guilt drawer, the forced wishlist, ten small gifts instead of one you'd actually love.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  alternates: { canonical: "/why" },
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "/why",
    siteName: "Giftaro",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
  },
};

const SYMPTOMS: { n: string; text: ReactNode }[] = [
  { n: "01", text: "A house of gifts you feel too guilty to part with." },
  { n: "02", text: "A forced wishlist because the real thing feels too much to ask." },
  {
    n: "03",
    text: <>Ten small gifts that could&rsquo;ve been one thing you&rsquo;d actually love.</>,
  },
];

export default function WhyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-6 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <span aria-hidden="true">&larr;</span> Back
          </Link>
        </div>

        {/* Hero */}
        <section className="mx-auto w-full max-w-xl px-6 pt-6 pb-10 text-center sm:pt-10">
          <div className="relative mx-auto mb-8 w-full max-w-[22rem] sm:max-w-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 bottom-2 h-6 rounded-[50%] bg-zinc-900/10 blur-xl dark:bg-black/40"
            />
            <Image
              src="/sad-to-happy-gifts.jpg"
              alt="A sad pile of mismatched gifts on the left, transforming into one big, glowing, smiling gift on the right."
              width={1024}
              height={1024}
              priority
              className="relative mx-auto h-auto w-full select-none"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <p className="font-pixel mb-3 text-[0.7rem] uppercase tracking-[0.24em] text-pink-600/90 dark:text-pink-400/90">
            PSA
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            People are elevating their lives with Giftaro.
          </h1>
          <p className="mt-6 text-2xl font-light italic text-zinc-500 dark:text-zinc-400 sm:mt-8 sm:text-3xl">
            Should you?
          </p>
        </section>

        {/* Signs */}
        <section className="mx-auto w-full max-w-xl px-6">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.08)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-7">
            <p className="font-pixel mb-5 text-[0.7rem] uppercase tracking-[0.24em] text-violet-600/90 dark:text-violet-400/90">
              Signs
            </p>
            <ul className="space-y-4">
              {SYMPTOMS.map(({ n, text }) => (
                <li
                  key={n}
                  className="flex items-start gap-4 text-[0.95rem] leading-relaxed text-zinc-700 dark:text-zinc-200"
                >
                  <span className="font-pixel flex-none pt-0.5 text-base leading-none text-violet-500/70 dark:text-violet-400/60">
                    {n}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mx-auto mt-8 max-w-md text-balance text-center text-lg text-zinc-600 dark:text-zinc-400">
            Giftaro pools what friends are already spending into the{" "}
            <span className="bg-gradient-to-r from-[#6366F1] via-[#A855F7] via-[#EC4899] to-[#F97316] bg-clip-text font-medium text-transparent">
              one thing you&rsquo;d actually love
            </span>
            .
          </p>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-xl px-6 pt-14 pb-24 text-center sm:pt-16">
          <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 sm:text-3xl">
            Skip the pile of stuff.
          </p>
          <p className="mb-6 text-2xl font-semibold text-zinc-800 dark:text-zinc-100 sm:text-3xl">
            Get something awesome.
          </p>
          <div className="flex justify-center">
            <LandingAuth variant="secondary" />
          </div>
        </section>
      </main>
    </div>
  );
}
