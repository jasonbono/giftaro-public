import Link from "next/link";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Support — Giftaro",
  description:
    "Questions, broken contribution, or just need a hand? Email us and a real human will get back to you within one business day.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Link
          href="/?mode=signup"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <span aria-hidden="true">←</span> Back
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Need a hand?
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          We&apos;re a small team and we read every message.
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p>
            Whether something&apos;s broken, a contribution didn&apos;t go
            through, or you just have a question — email us and a real human
            will get back to you.
          </p>

          <p>
            <a
              href="mailto:support@giftaro.app"
              className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              support@giftaro.app
            </a>
          </p>

          <p className="text-zinc-500 dark:text-zinc-400">
            We aim to reply within one business day.
          </p>

          <p className="text-zinc-500 dark:text-zinc-400">
            Giftaro is operated by [Company]
          </p>
        </div>
      </main>
    </div>
  );
}
