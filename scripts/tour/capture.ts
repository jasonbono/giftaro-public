/**
 * Playwright captures + email HTML rendering.
 *
 * Each capture is a `Shot`. Each shot belongs to a `Section` (a user flow).
 * The result is a flat array of {section, label, file} that build-html.ts
 * turns into a sidebar TOC + a grid of mobile screenshots.
 *
 * Email captures: import the email functions, monkey-patch the Resend client,
 * intercept the HTML body, render it in a Playwright page sized to a phone.
 */
import { webkit, devices, type BrowserContext, type Page } from "playwright";
import fs from "fs";
import path from "path";
import type { Cast } from "./seed";

const APP = "http://localhost:3001";
const iPhone = devices["iPhone 14 Pro"] || devices["iPhone 13 Pro"];

export type Shot = { section: string; label: string; file: string };

async function shoot(page: Page, outDir: string, file: string) {
  // Hide the Next.js dev indicator (the "N" badge) — it's a dev-only artifact
  // that real users never see, so it shouldn't appear in design-review shots.
  await page.addStyleTag({
    content: `nextjs-portal, [data-next-mark], [data-nextjs-dev-tools-button], [data-nextjs-toast], #__next-build-watcher { display: none !important; }`,
  }).catch(() => {});
  // Scroll through the page to trigger IntersectionObserver-driven content
  // (e.g. the card wall on /gift/[id] uses useInView for entrance animations).
  // Without this, anything below the initial viewport renders as opacity:0.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  const full = path.join(outDir, file);
  await page.screenshot({ path: full, fullPage: true, type: "jpeg", quality: 75 });
}

async function newAnonContext(browser: import("playwright").Browser) {
  return browser.newContext({ ...iPhone, viewport: { width: 390, height: 844 } });
}

async function newSignedInContext(
  browser: import("playwright").Browser,
  cookieHeader: string,
) {
  const ctx = await newAnonContext(browser);
  const cookies = cookieHeader.split(";").map((c) => c.trim()).filter(Boolean).map((c) => {
    const [name, ...rest] = c.split("=");
    return {
      name: name.trim(),
      value: rest.join("=").trim(),
      domain: "localhost",
      path: "/",
    };
  });
  await ctx.addCookies(cookies);
  return ctx;
}

export async function capture(cast: Cast, outDir: string): Promise<Shot[]> {
  fs.mkdirSync(outDir, { recursive: true });
  // Clean prior screenshots so stale shots can't sneak into the report.
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".html")) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }

  const shots: Shot[] = [];
  const add = (section: string, label: string, file: string) => {
    shots.push({ section, label, file });
  };

  const browser = await webkit.launch();

  try {
    // ===== Marketing & Auth (anonymous) =====
    {
      const ctx = await newAnonContext(browser);
      const page = await ctx.newPage();

      const routes: Array<[string, string, string]> = [
        ["/", "Landing", "10-landing.jpg"],
        ["/sign-in", "Sign in", "11-sign-in.jpg"],
        ["/sign-up", "Sign up", "12-sign-up.jpg"],
        ["/privacy", "Privacy", "13-privacy.jpg"],
        ["/terms", "Terms", "14-terms.jpg"],
      ];
      for (const [route, label, file] of routes) {
        await page.goto(`${APP}${route}`, { waitUntil: "networkidle" });
        await shoot(page, outDir, file);
        add("Marketing & Auth", label, file);
      }
      await ctx.close();
    }

    // ===== Organizer Dashboard =====
    {
      const ctx = await newSignedInContext(browser, cast.organizer.cookie);
      const page = await ctx.newPage();

      await page.goto(`${APP}/dashboard`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "20-dashboard.jpg");
      add("Organizer Dashboard", "Dashboard (active + past gifts)", "20-dashboard.jpg");

      // Open user menu
      try {
        const avatar = page.locator("header button").last();
        await avatar.click({ timeout: 2000 });
        await page.waitForTimeout(500);
        await shoot(page, outDir, "21-user-menu.jpg");
        add("Organizer Dashboard", "User menu open", "21-user-menu.jpg");
        await page.keyboard.press("Escape").catch(() => {});
      } catch {}

      await ctx.close();
    }

    // ===== Onboarding (Stripe) =====
    {
      const ctx = await newSignedInContext(browser, cast.emptyOrganizer.cookie);
      const page = await ctx.newPage();
      await page.goto(`${APP}/dashboard`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "30-onboarding.jpg");
      add("Onboarding", "Activation checklist on dashboard", "30-onboarding.jpg");
      await ctx.close();
    }

    // ===== Create a gift =====
    {
      const ctx = await newSignedInContext(browser, cast.organizer.cookie);
      const page = await ctx.newPage();

      await page.goto(`${APP}/dashboard/gifts/new`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "40-new-gift-empty.jpg");
      add("Create a Gift", "Empty form", "40-new-gift-empty.jpg");

      const inputs = await page.locator("form input:not([type=file]), form textarea").all();
      if (inputs.length >= 5) {
        await inputs[0].fill("Drum kit");
        await inputs[1].fill("Jamie's birthday");
        await inputs[2].fill("500");
        await inputs[3].fill("Seven years of playing imaginary drums on the kitchen counter — let's get him real ones.");
        await inputs[4].fill("Jordan");
        await shoot(page, outDir, "41-new-gift-filled.jpg");
        add("Create a Gift", "Filled out, ready to submit", "41-new-gift-filled.jpg");
      }
      await ctx.close();
    }

    // ===== Edit a gift =====
    {
      const ctx = await newSignedInContext(browser, cast.organizer.cookie);
      const page = await ctx.newPage();
      await page.goto(`${APP}/dashboard/gifts/${cast.gifts.active}/edit`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "42-edit-gift.jpg");
      add("Create a Gift", "Edit existing gift", "42-edit-gift.jpg");
      await ctx.close();
    }

    // ===== Public gift — organizer's own view =====
    {
      const ctx = await newSignedInContext(browser, cast.organizer.cookie);
      const page = await ctx.newPage();

      await page.goto(`${APP}/dashboard/gifts/${cast.gifts.empty}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "50-detail-empty.jpg");
      add("Gift Detail (Organizer)", "Empty gift, no contributions yet", "50-detail-empty.jpg");

      await page.goto(`${APP}/dashboard/gifts/${cast.gifts.active}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "51-detail-active.jpg");
      add("Gift Detail (Organizer)", "Active gift with contributions", "51-detail-active.jpg");

      // Flip every card via "Reveal all amounts" to show the back (amount) side.
      // Flip is organizer-only; contributors on the public /gift/[id] page
      // never see amounts.
      try {
        await page.getByRole("button", { name: "Reveal all amounts" }).click({ timeout: 2000 });
        await page.waitForTimeout(700); // flip animation (400ms) + visibility delay (200ms)
        await shoot(page, outDir, "51b-detail-active-revealed.jpg");
        add("Gift Detail (Organizer)", "Active gift — all amounts revealed", "51b-detail-active-revealed.jpg");
      } catch {}

      await page.goto(`${APP}/dashboard/gifts/${cast.gifts.active}?created=true`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "52-detail-just-created.jpg");
      add("Gift Detail (Organizer)", "Just-created confetti view", "52-detail-just-created.jpg");

      await page.goto(`${APP}/dashboard/gifts/${cast.gifts.funded}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "53-detail-funded.jpg");
      add("Gift Detail (Organizer)", "Fully funded, still open", "53-detail-funded.jpg");

      try {
        await page.getByRole("button", { name: "Reveal all amounts" }).click({ timeout: 2000 });
        await page.waitForTimeout(700);
        await shoot(page, outDir, "53b-detail-funded-revealed.jpg");
        add("Gift Detail (Organizer)", "Fully funded — all amounts revealed", "53b-detail-funded-revealed.jpg");
      } catch {}

      await page.goto(`${APP}/dashboard/gifts/${cast.gifts.closed}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "54-detail-closed.jpg");
      add("Gift Detail (Organizer)", "Closed / wrapped", "54-detail-closed.jpg");

      await ctx.close();
    }

    // ===== Public gift — contributor view (anonymous) =====
    {
      const ctx = await newAnonContext(browser);
      const page = await ctx.newPage();

      await page.goto(`${APP}/gift/${cast.gifts.empty}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "60-public-empty.jpg");
      add("Public Gift (Contributor)", "Empty gift — first contribution invite", "60-public-empty.jpg");

      await page.goto(`${APP}/gift/${cast.gifts.active}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "61-public-active.jpg");
      add("Public Gift (Contributor)", "Active gift with card wall", "61-public-active.jpg");

      // Scroll to contribute form
      const anchor = await page.$("#contribute");
      if (anchor) {
        await anchor.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(outDir, "62-contribute-form.jpg"),
          fullPage: false,
          type: "jpeg",
          quality: 75,
        });
        add("Public Gift (Contributor)", "Contribute form (in viewport)", "62-contribute-form.jpg");
      }

      await page.goto(`${APP}/gift/${cast.gifts.funded}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "63-public-funded.jpg");
      add("Public Gift (Contributor)", "Fully funded but still open", "63-public-funded.jpg");

      await page.goto(`${APP}/gift/${cast.gifts.closed}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "64-public-wrapped.jpg");
      add("Public Gift (Contributor)", "Wrapped/closed gift", "64-public-wrapped.jpg");

      await page.goto(`${APP}/gift/${cast.gifts.notOnboarded}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "65-public-not-onboarded.jpg");
      add("Public Gift (Contributor)", "Organizer hasn't onboarded yet", "65-public-not-onboarded.jpg");

      await ctx.close();
    }

    // ===== Just-paid success state =====
    {
      const ctx = await newAnonContext(browser);
      const page = await ctx.newPage();
      const url = `${APP}/gift/${cast.successContribution.giftId}?success=true&session_id=${cast.successContribution.sessionId}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await shoot(page, outDir, "66-public-just-paid.jpg");
      add("Public Gift (Contributor)", "Success — just chipped in", "66-public-just-paid.jpg");
      await ctx.close();
    }

    // ===== Reveal page =====
    {
      const ctx = await newSignedInContext(browser, cast.organizer.cookie);
      const page = await ctx.newPage();
      await page.goto(`${APP}/gift/${cast.gifts.closed}/reveal`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "70-reveal.jpg");
      add("Reveal", "Reveal page (organizer)", "70-reveal.jpg");
      await ctx.close();
    }

    // ===== Edge / static =====
    {
      const ctx = await newAnonContext(browser);
      const page = await ctx.newPage();

      await page.goto(`${APP}/gift/00000000-0000-0000-0000-000000000000`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "80-gift-not-found.jpg");
      add("Edge States", "Gift not found (404)", "80-gift-not-found.jpg");

      await page.goto(`${APP}/gift/${cast.gifts.removed}`, { waitUntil: "networkidle" });
      await shoot(page, outDir, "81-gift-removed.jpg");
      add("Edge States", "Gift removed by organizer", "81-gift-removed.jpg");

      await ctx.close();
    }

    // ===== Emails =====
    await captureEmails(browser, outDir, shots);
  } finally {
    await browser.close();
  }

  return shots;
}

async function captureEmails(
  browser: import("playwright").Browser,
  outDir: string,
  shots: Shot[],
) {
  // Intercept the Resend SDK at the network layer. The SDK uses global
  // fetch internally, so we can capture the JSON body without touching
  // their constructor or instance shape.
  const captured: { html: string }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("api.resend.com") && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        if (typeof body.html === "string") captured.push({ html: body.html });
      } catch {}
      return new Response(JSON.stringify({ id: "stub" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return originalFetch(input as RequestInfo, init);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  const giftUrl = `${APP}/gift/sample-id`;
  const email = await import("../../src/lib/email");

  await email.sendContributionEmail({
    organizerEmail: "jordan@example.com",
    organizerName: "Jordan",
    giftTitle: "Drum kit",
    contributorName: "Maya Chen",
    amountCents: 5000,
    contributorNote: "Rock on, Jamie!",
    totalContributedCents: 27500,
    targetAmountCents: 50000,
    giftUrl,
  });
  await email.sendContributorReceiptEmail({
    contributorEmail: "maya@example.com",
    contributorName: "Maya",
    organizerName: "Jamie",
    giftTitle: "Drum kit",
    amountCents: 5000,
    totalContributedCents: 27500,
    targetAmountCents: 50000,
    giftUrl,
  });
  await email.sendFullyFundedEmail({
    contributorEmail: "maya@example.com",
    contributorName: "Maya",
    giftTitle: "Drum kit",
    giftUrl,
  });

  const labels = [
    "Organizer: someone chipped in",
    "Contributor: receipt",
    "Contributor: pool is full",
  ];
  const files = ["90-email-contribution.jpg", "91-email-receipt.jpg", "92-email-funded.jpg"];

  // Emails are designed for ~480px max-width. Use a desktop-ish context so
  // the inner div centres naturally; we capture the email div itself, not
  // the whole page (which would have huge whitespace below the content).
  const ctx = await browser.newContext({ viewport: { width: 540, height: 800 } });
  const page = await ctx.newPage();
  for (let i = 0; i < captured.length; i++) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;}#wrap{display:inline-block;}</style></head><body><div id="wrap">${captured[i].html}</div></body></html>`;
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    const wrap = await page.$("#wrap");
    if (wrap) {
      await wrap.screenshot({ path: path.join(outDir, files[i]), type: "jpeg", quality: 85 });
      shots.push({ section: "Emails", label: labels[i], file: files[i] });
    }
  }
  await ctx.close();
  globalThis.fetch = originalFetch;
}
