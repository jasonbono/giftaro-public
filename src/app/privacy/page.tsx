import Link from "next/link";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Privacy Policy — Giftaro",
  description:
    "What Giftaro collects, how we use it, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: April 14, 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p>
            Giftaro is operated by [Company] (&quot;we&quot;,
            &quot;us&quot;). This Policy explains what we
            collect, how we use it, and the choices you have. Using Giftaro
            means you agree to this Policy.
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              What we collect
            </h2>
            <p>
              <strong>Account info</strong> when you sign up: name, email, and
              authentication details (a Google account ID or a password hash).
              You may also add a profile photo.
            </p>
            <p className="mt-2">
              <strong>Gift info</strong> when you create or contribute to a
              gift: titles, descriptions, photos, target amounts, recipient
              details you enter, messages, and the amount you contribute.
            </p>
            <p className="mt-2">
              <strong>Payment info</strong> through Stripe, which handles all
              card data — we never see your full card number. We do receive
              limited metadata like amount, currency, status, last four digits,
              Stripe IDs, and, for organizers, payout and verification details
              we need to run the Service.
            </p>
            <p className="mt-2">
              <strong>Usage and device data</strong> from normal server logs
              and web/app telemetry: IP address, browser/user-agent, device
              type, timestamps, and pages viewed.
            </p>
            <p className="mt-2">
              <strong>Communications</strong> you send us, plus the
              transactional emails we send you (receipts, notifications).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              How we use it
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>run the Service — create accounts, host gifts, process contributions, pay organizers out;</li>
              <li>send transactional messages (receipts, security, account notices);</li>
              <li>prevent fraud and abuse, enforce our Terms, and meet legal and accounting obligations;</li>
              <li>understand usage so we can improve the product;</li>
              <li>with consent or where permitted, send occasional product updates.</li>
            </ul>
            <p className="mt-2">
              We don&apos;t sell your personal information, and we don&apos;t
              use it for third-party advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              AI features
            </h2>
            <p>
              Some features use third-party AI providers to generate text (for
              example, suggested gift descriptions). Inputs you provide to
              those features are sent to the provider under their terms and
              are not used by us for advertising profiles.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Who we share with
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Service providers</strong> who help us run Giftaro — Stripe (payments and identity verification), Google (authentication), our hosting provider (Vercel), our database provider (Turso), our email provider, and AI providers for generative features.</li>
              <li><strong>Other users</strong> where it&apos;s part of the product — for example, an organizer sees the name (or display name), amount, and message a contributor submits.</li>
              <li><strong>Legal and safety</strong> — to comply with law, respond to lawful requests, enforce our Terms, or protect rights and safety.</li>
              <li><strong>Business transfers</strong> — in connection with a merger, acquisition, financing, or sale of assets, subject to this Policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Cookies
            </h2>
            <p>
              We use first-party cookies to keep you signed in, remember
              preferences, and secure the Service. Our analytics and
              performance tools are cookieless and don&apos;t track you across
              sites. You can turn cookies off in your browser; parts of the
              Service may break if you do.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Data retention
            </h2>
            <p>
              We keep personal information for as long as your account is
              active or as needed to run the Service. We keep transaction
              records for as long as required by tax, accounting, anti-fraud,
              and legal obligations — typically up to seven years. You can
              request deletion; we may retain limited information where the
              law requires it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Security
            </h2>
            <p>
              We use reasonable technical and organizational measures to
              protect your information — encryption in transit, access
              controls, and reputable hosting partners. No system is perfectly
              secure; you use the Service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Your choices and rights
            </h2>
            <p>
              Depending on where you live (California and other U.S. states,
              the EEA, the UK) you may have rights to access, correct, delete,
              export, or object to certain uses of your information, and to
              withdraw consent. Email{" "}
              <a
                href="mailto:support@giftaro.app"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                support@giftaro.app
              </a>{" "}
              to exercise these rights. We won&apos;t discriminate against you
              for exercising them. For EEA/UK users, our legal bases for
              processing are contract, legitimate interests, legal obligation,
              and consent.
            </p>
            <p className="mt-2">
              You can delete your account at any time. Some records related to
              past transactions will be retained as described above.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Children
            </h2>
            <p>
              Giftaro isn&apos;t directed to children under 13, and we
              don&apos;t knowingly collect information from them. If you
              believe a child has given us information, contact us and we will
              delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              International users
            </h2>
            <p>
              We operate in the United States. If you use Giftaro from outside
              the U.S., your information will be transferred to and processed
              in the U.S. and other countries where our providers operate,
              which may have different data-protection laws than yours.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Changes
            </h2>
            <p>
              We may update this Policy as Giftaro evolves. If changes are
              material, we&apos;ll let you know (for example, by email or in
              the app) and update the date above.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Contact
            </h2>
            <p>
              [Company] — privacy questions or requests can be sent to{" "}
              <a
                href="mailto:support@giftaro.app"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                support@giftaro.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
