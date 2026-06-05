# App tour

Snapshot of every page × state in the app, assembled into a single HTML file
for design review. Run when you (the human) ask — never proactively.

```bash
npm run tour
```

Produces `scripts/tour/output/tour.html` and opens it. Sticky sidebar TOC,
mobile screenshots in a 2-3 column grid, grouped by user flow.

## Intent

You should be able to scroll one HTML page and see the entire surface of the
app — every screen, in every meaningful state — without picking up a phone
or clicking through the live site. That's it.

The tour exists so you can re-design without context-switching. If a state
isn't representable in the tour, you'll forget about it during a redesign and
ship a regression.

## What it covers

- **Marketing & auth** — landing, sign-in, sign-up, privacy, terms.
- **Organizer dashboard** — empty/active gifts, user menu, contributions list.
- **Onboarding** — Stripe Connect nudge.
- **Create / edit gift** — empty form, filled form, edit existing.
- **Gift detail (organizer)** — empty, active, just-created confetti, fully
  funded, closed.
- **Public gift (contributor)** — empty, active w/ card wall, contribute form
  in viewport, fully funded, wrapped, organizer-not-onboarded, just-paid.
- **Reveal** — closing animation.
- **Edge** — 404, removed gift.
- **Emails** — every Resend template intercepted and rendered.

Dark mode is intentionally out of scope until it's a launch priority.

## How it works (1-paragraph version)

`run.ts` wipes a local SQLite file, pushes the Drizzle schema into it,
spawns `next dev` on port 3001 with stub env (so it can't reach Stripe/Turso),
seeds a canonical cast (`seed.ts`), drives Playwright through every page
(`capture.ts`), intercepts the Resend client to render email HTML, and
assembles everything into one HTML file (`build-html.ts`). Port 3001 means
your normal `npm run dev` on 3000 keeps running. The dev server is killed
when the tour exits.

The success / "you just chipped in" page is captured without touching Stripe:
the seed inserts a contribution with `status='succeeded'` and a known
`stripe_checkout_session_id`, and `fulfillCheckoutSession` early-returns when
status is already succeeded (see `src/lib/stripe.ts`).

## When to add a new state

Anything that materially changes what the user sees. New banner? New empty
state? New error toast? Add a shot to `capture.ts` and a row to `seed.ts` if
it needs new data. Shots are a flat array of `{section, label, file}` —
sections are user flows, files are kebab-case PNGs.

## When NOT to add a new state

- Pure visual variants (one button color, one font weight). The tour shows
  the *layout shape* of every state, not every styling permutation.
- Hover/focus states. iOS doesn't really have them.
- Loading skeletons that flash for <500ms.

## What can go stale

- **Schema drift**: `seed.ts` writes raw INSERTs. If you add a notNull column
  without a default, seed will fail loudly — fix it there. Drizzle's snapshot
  is the source of truth for column shape.
- **Selectors in `capture.ts`**: the new-gift form fills inputs by index
  order. If you reorder form fields, fix the indexes there.
- **Branch coverage**: the tour runs on whatever branch you're checked out
  on. The git branch name appears in the sidebar so you can tell tours apart.

## Dependencies

`tsx` (runs the TypeScript), `playwright` + WebKit browser, `@libsql/client`,
all in `devDependencies`. First run on a new machine:
`npx playwright install webkit`.
