import Link from "next/link";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Terms of Service — Giftaro",
  description:
    "The terms that govern using Giftaro as an organizer or contributor.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: April 14, 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p>
            Giftaro is operated by [Company] (&quot;we&quot;,
            &quot;us&quot;). By creating an account, contributing to a gift, or
            otherwise using Giftaro (the &quot;Service&quot;), you agree to these
            Terms. If you don&apos;t agree, don&apos;t use the Service.
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              What Giftaro does
            </h2>
            <p>
              Giftaro helps an organizer collect money from contributors for a
              gift. Contributors pay through the Service and funds are paid out
              to the organizer. Our role ends when the organizer receives the
              money — we don&apos;t select, buy, deliver, or guarantee any gift.
              The actual gift happens offline and is the organizer&apos;s
              responsibility.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Who can use it
            </h2>
            <p>
              You must be at least 18 and able to form a binding contract. By
              using Giftaro you confirm you meet those requirements and that
              your use is legal where you are.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Your account
            </h2>
            <p>
              Organizers create an account with Google or email/password. You
              are responsible for your account, your credentials, and everything
              that happens under it. Contributors don&apos;t need an account to
              chip in. Tell us right away if you suspect unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Payments, fees, and payouts
            </h2>
            <p>
              Payments are processed by Stripe, Inc. under Stripe&apos;s own
              terms (including the Stripe Services Agreement and Stripe
              Connected Account Agreement). By using the Service you agree to
              those terms and authorize us and Stripe to collect and disburse
              funds on your behalf.
            </p>
            <p className="mt-2">
              Giftaro charges a platform fee (a small percentage of each contribution)
              plus payment-processing fees, disclosed to the contributor at
              checkout. Organizers are responsible for completing Stripe&apos;s
              identity checks and for any taxes on funds they receive. Payouts,
              holds, and reversals follow Stripe&apos;s policies. Fees may
              change; current fees will always be shown before a contributor
              pays.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Refunds and disputes
            </h2>
            <p>
              Contributions are generally non-refundable once paid. If a
              contribution was unauthorized or made in error, contact us and,
              if it makes sense, the organizer. Chargebacks are handled by
              Stripe, and we may deduct any resulting losses or fees from
              amounts otherwise payable to the organizer.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Your content
            </h2>
            <p>
              You&apos;re responsible for content you submit (gift titles,
              descriptions, photos, messages, names). You confirm you have the
              right to submit it and that it doesn&apos;t violate any law or
              third-party right. You grant [Company] a worldwide, royalty-free
              license to host and display your content solely to operate and
              improve the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Acceptable use
            </h2>
            <p>Don&apos;t use Giftaro to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>break the law, or commit fraud, money laundering, or sanctions evasion;</li>
              <li>collect money for anything other than a real gift, or misrepresent the purpose or recipient;</li>
              <li>impersonate anyone or submit someone else&apos;s information without permission;</li>
              <li>post harmful, infringing, harassing, hateful, or sexually explicit content;</li>
              <li>access accounts or data you shouldn&apos;t, or interfere with the Service;</li>
              <li>run any activity restricted by Stripe&apos;s prohibited-business list.</li>
            </ul>
            <p className="mt-2">
              We can remove content, suspend, or terminate accounts for
              violations, suspected fraud, or risk to the Service or its users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Third-party services
            </h2>
            <p>
              Giftaro relies on third parties (like Stripe, Google, hosting, and
              email providers). We&apos;re not responsible for their services
              or outages, and your use of them is subject to their own terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Disclaimers and liability
            </h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. WE DON&apos;T
              GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR
              ERROR-FREE, OR THAT ANY GIFT WILL BE PURCHASED OR DELIVERED.
            </p>
            <p className="mt-2">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, [COMPANY] WILL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL. OUR
              TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE WILL NOT
              EXCEED THE GREATER OF (a) THE PLATFORM FEES YOU PAID US IN THE 12
              MONTHS BEFORE THE CLAIM OR (b) US$100. You agree to indemnify
              [Company] from claims arising out of your use of the Service, your
              content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Termination
            </h2>
            <p>
              You can stop using Giftaro and delete your account at any time.
              We can suspend or terminate access if we believe you&apos;ve
              violated these Terms or pose risk to the Service or its users.
              Sections that by their nature should survive termination will.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the State of Delaware,
              without regard to conflict-of-law rules. Any dispute must be
              brought in the state or federal courts located in Delaware, and
              you consent to jurisdiction and venue there.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Changes
            </h2>
            <p>
              We may update these Terms as Giftaro evolves. If changes are
              material, we&apos;ll let you know (for example, by email or in
              the app). Continued use after an update means you accept the new
              version.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Contact
            </h2>
            <p>
              [Company] — questions about these Terms can be sent to{" "}
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
