# Giftaro

**A production, mobile-first group-gifting web app, designed and built end to end.**

Someone names one real gift they want and shares a link. The people who love them chip in
to fund it, instead of everyone buying separate small gifts. Money is collected by card
through Stripe Connect and paid out directly to the organizer's bank account. Contributors
don't need an account.

This repository is a public, sanitized snapshot of the production codebase, shared as an
engineering work sample. See [About this repository](#about-this-repository) for what was
generalized and why.

## Highlights

- **Real payments, end to end.** Stripe Connect Express with destination charges, a platform
  fee, payouts, refunds, and disputes. Not a toy checkout.
- **Correct under failure.** Idempotency runs from the client through the database to Stripe,
  and webhook handling is idempotent via a compare-and-set event log, so retries and Stripe
  redeliveries never double-charge or double-send an email.
- **Full-stack, solo.** Next.js 16 and React 19 front to back, Turso (libSQL) with Drizzle,
  Better Auth, Resend, Stripe, and Vercel.
- **Built to be found.** Programmatic SEO (occasion pages and MDX guides auto-wired into the
  sitemap, OpenGraph images, and JSON-LD), plus `llms.txt` routes for AI crawlers.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Turso (libSQL) with Drizzle ORM |
| Auth | Better Auth (self-hosted): Google OAuth and email/password |
| Payments | Stripe Connect Express (destination charges plus platform fee) |
| Email | Resend (transactional) |
| Storage | Vercel Blob |
| Hosting | Vercel (auto-deploy from `main`, daily cron) |

## Engineering highlights

The parts worth reading:

**Payments** ([`src/lib/stripe.ts`](src/lib/stripe.ts), [`src/app/api/stripe/webhooks/route.ts`](src/app/api/stripe/webhooks/route.ts))
- Stripe Connect Express with destination charges. Contributors pay by card with no account,
  funds settle to the organizer's connected account, and the platform fee is taken as a
  transparent line item.
- Fee gross-up, so the organizer nets exactly the intended amount after Stripe's cut.
- End-to-end idempotency: the client mints a UUID per contribution attempt, backed by a
  `UNIQUE` index on the contribution row and a Stripe idempotency key, so a retried or
  dropped request can't double-charge.
- Idempotent webhook processing: a compare-and-set claim into a `webhook_event_log` table
  dedupes Stripe redeliveries and recovers from partially processed events. The full
  lifecycle is handled: checkout, payment success and failure, refunds, disputes, and
  Connect `account.updated`.
- Careful edge cases: a refund or dispute that drops a gift back below its goal clears the
  "fully funded" flag so a later top-up re-notifies correctly, and payout status is synced
  from Stripe by webhook rather than trusted from the client.

**Data model** ([`src/lib/drizzle-schema.ts`](src/lib/drizzle-schema.ts))
- Money stored as integer cents, foreign keys with cascade deletes, indexes on every lookup
  path, and unique dedup indexes for idempotency keys and reactions.
- Schema as the source of truth, with versioned Drizzle migrations applied automatically on
  deploy. (Generated migration files are omitted from this snapshot.)

**Security and infrastructure** ([`src/lib/rate-limit.ts`](src/lib/rate-limit.ts), [`next.config.ts`](next.config.ts))
- IP rate limiting that reads the trusted edge-set client IP (resistant to `x-forwarded-for`
  spoofing), with an honest note on its cold-start limitations.
- Strict security headers (HSTS preload, `X-Frame-Options: DENY`, `nosniff`,
  `Permissions-Policy`), image-source allowlisting, and content-addressed immutable caching.

**SEO infrastructure** ([`src/app/sitemap.ts`](src/app/sitemap.ts), [`src/lib/seo.ts`](src/lib/seo.ts), [`src/data/occasions.ts`](src/data/occasions.ts))
- Programmatic occasion landing pages and MDX content guides that auto-wire into the sitemap,
  per-page OpenGraph images, and JSON-LD (Article, FAQ, HowTo, Breadcrumb).
- Dynamic `llms.txt` and `llms-full.txt` routes plus IndexNow integration.

**Frontend** ([`src/app/`](src/app/), [`src/components/`](src/components/))
- Mobile-first App Router UI, a contributor flow that needs no account, contribution-form
  drafts that persist across reloads, and accessible components.

## Project structure

```
src/
  app/              # App Router pages + API routes
    api/            #   auth, gifts, contributions, stripe/*, cron, uploads
    gift/[id]/      #   public contributor flow
    dashboard/      #   organizer flow
  components/       # UI + feature components
  lib/              # stripe, drizzle, auth, email, image, seo, rate-limit, ...
    drizzle-schema.ts  # database schema, the source of truth
  content/guides/   # MDX content system (one example guide; library omitted)
  data/occasions.ts  # programmatic SEO pages (one example; full set omitted)
scripts/tour/       # Playwright screenshot-tour harness
```

## About this repository

This is a public, point-in-time snapshot of a private production codebase, shared as an
engineering work sample. The application logic and architecture are intact. What has been
generalized or removed is everything that isn't engineering, so the real system can be read
without exposing the live business.

Generalized, replaced with representative placeholders, or omitted for security, IP, and
brand reasons:

- **Secrets and identifiers.** Every credential is loaded from environment variables and was
  never committed (see [`.env.local.example`](.env.local.example)); personal and account
  identifiers are removed.
- **Brand and media.** Logos, visual assets, and licensed or third-party imagery.
- **Proprietary content.** Marketing copy and the SEO content library. The systems that
  generate them remain, with a representative example.
- **Business-sensitive values.** Selected pricing and fee parameters, and model prompts.
- **Internal docs and infrastructure.** Strategy, operations, and deployment or account details.

No secrets exist in this repository or its git history, and nothing here is the deployed
artifact. The snapshot's history begins at a single commit.

## License

All rights reserved. Published for portfolio viewing and technical evaluation only, not
licensed for use, modification, or redistribution. See [LICENSE](LICENSE).
