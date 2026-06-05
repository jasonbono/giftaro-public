/**
 * Seeds the tour DB with a canonical cast of users, gifts, contributions, and
 * reactions. Designed to exercise every meaningful state the public app can
 * render — empty, mid-fund, fully-funded, just-paid, removed.
 *
 * Reads TURSO_DATABASE_URL from env (set by run.ts to a local file:// URL).
 * Calls /api/auth/sign-up/email so password hashes match better-auth's format.
 */
import { createClient } from "@libsql/client";
import { execSync } from "child_process";

const APP = "http://localhost:3001";

export type Cast = {
  organizer: { id: string; email: string; password: string; cookie: string };
  emptyOrganizer: { id: string; email: string; password: string; cookie: string };
  gifts: {
    empty: string; // open, no contributions, organizer onboarded
    active: string; // open, partway funded, lots of activity
    funded: string; // open and just hit goal — for fully-funded state
    closed: string; // wrapped/closed
    removed: string; // soft-deleted
    notOnboarded: string; // open but organizer not Stripe-onboarded
  };
  successContribution: {
    giftId: string;
    sessionId: string;
    amountCents: number;
  };
};

const id = () => Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
const now = () => new Date().toISOString().replace("T", " ").replace(/\..*/, "");

async function signUp(email: string, password: string, name: string) {
  const r = await fetch(`${APP}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: APP,
    },
    body: JSON.stringify({ email, password, name }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`sign-up ${email} failed: ${r.status} ${body}`);
  }
  const setCookie = r.headers.get("set-cookie") || "";
  // Extract just the session token cookie pair(s)
  const cookie = setCookie
    .split(/,(?=\s*[a-zA-Z0-9_.-]+=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
  const data = await r.json();
  const userId = data?.user?.id || data?.data?.user?.id;
  if (!userId) throw new Error(`sign-up ${email}: no user id in response: ${JSON.stringify(data)}`);
  return { id: userId as string, cookie };
}

export async function seed(dbUrl: string): Promise<Cast> {
  // Wait for dev server
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${APP}/api/auth/get-session`);
      if (r.status < 500) break;
    } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }

  // Sign up the organizers via better-auth so password hashing matches.
  const organizer = await signUp("tour-organizer@giftaro.test", "tour-seed-password", "Jordan Lee");
  const emptyOrganizer = await signUp("tour-empty@giftaro.test", "tour-seed-password", "Sam Rivera");

  const client = createClient({ url: dbUrl });

  // Mark the main organizer as onboarded so contribute forms render.
  await client.execute({
    sql: `UPDATE users SET stripe_account_id = ?, charges_enabled = 1, payouts_enabled = 1, onboarding_status = 'complete', updated_at = ? WHERE id = ?`,
    args: ["acct_tour_organizer", now(), organizer.id],
  });

  // ---- Gifts ----
  const giftIds = {
    empty: id(),
    active: id(),
    funded: id(),
    closed: id(),
    removed: id(),
    notOnboarded: id(),
  };

  type GiftRow = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    target_amount_cents: number;
    organizer_name: string | null;
    total_contributed_cents: number;
    status: "open" | "closed";
    og_title: string | null;
    og_image: string | null;
    trashed_at: string | null;
    expected_contributors: number | null;
  };

  const gifts: GiftRow[] = [
    {
      id: giftIds.empty,
      user_id: organizer.id,
      title: "Camera kit",
      description: "She's been borrowing mine for a year — let's get her one of her own.",
      target_amount_cents: 80000,
      organizer_name: "Jordan",
      total_contributed_cents: 0,
      status: "open",
      og_title: "Sony A7C II",
      og_image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
      trashed_at: null,
      expected_contributors: 8,
    },
    {
      id: giftIds.active,
      user_id: organizer.id,
      title: "Drum kit",
      description: "Seven years of playing imaginary drums on the kitchen counter — let's get him real ones.",
      target_amount_cents: 50000,
      organizer_name: "Jordan",
      total_contributed_cents: 27500,
      status: "open",
      og_title: "Pearl Roadshow 5-piece",
      og_image: "https://images.unsplash.com/photo-1457523054379-8d051f8d72c0?w=800",
      trashed_at: null,
      expected_contributors: 12,
    },
    {
      id: giftIds.funded,
      user_id: organizer.id,
      title: "Honeymoon fund",
      description: "They picked Lisbon. We're sending them in style.",
      target_amount_cents: 120000,
      organizer_name: "Jordan",
      total_contributed_cents: 124000,
      status: "open",
      og_title: "Lisbon honeymoon",
      og_image: "https://images.unsplash.com/photo-1513735492246-483525079686?w=800",
      trashed_at: null,
      expected_contributors: 15,
    },
    {
      id: giftIds.closed,
      user_id: organizer.id,
      title: "Wedding gift pool",
      description: "We came together and gave them the kitchen of their dreams.",
      target_amount_cents: 200000,
      organizer_name: "Jordan",
      total_contributed_cents: 215000,
      status: "closed",
      og_title: "All-Clad cookware set",
      og_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      trashed_at: null,
      expected_contributors: 20,
    },
    {
      id: giftIds.removed,
      user_id: organizer.id,
      title: "Old gift",
      description: "Removed by organizer.",
      target_amount_cents: 10000,
      organizer_name: "Jordan",
      total_contributed_cents: 0,
      status: "open",
      og_title: null,
      og_image: null,
      trashed_at: now(),
      expected_contributors: null,
    },
    {
      id: giftIds.notOnboarded,
      user_id: emptyOrganizer.id,
      title: "Birthday surprise",
      description: "Big 4-0. Going all out.",
      target_amount_cents: 30000,
      organizer_name: "Sam",
      total_contributed_cents: 0,
      status: "open",
      og_title: "Birthday surprise",
      og_image: null,
      trashed_at: null,
      expected_contributors: 6,
    },
  ];

  for (const g of gifts) {
    await client.execute({
      sql: `INSERT INTO gifts (id, user_id, title, description, target_amount_cents, organizer_name, currency, total_contributed_cents, status, og_title, og_image, trashed_at, expected_contributors, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'usd', ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        g.id, g.user_id, g.title, g.description, g.target_amount_cents,
        g.organizer_name, g.total_contributed_cents, g.status, g.og_title,
        g.og_image, g.trashed_at, g.expected_contributors, now(), now(),
      ],
    });
  }

  // ---- Contributions for the active gift ----
  // Mix of named, anonymous, with notes, with images, varying amounts.
  type ContribRow = {
    id: string;
    gift_id: string;
    amount_cents: number;
    contributor_name: string | null;
    contributor_note: string | null;
    contributor_image_url: string | null;
    contributor_email: string | null;
    status: "succeeded" | "pending";
    stripe_checkout_session_id: string | null;
  };

  // Most contributors pick a 3D stock emoji in the contribute form — it's the
  // fastest option. Mix in one face photo for variety and a couple of nulls so
  // every card-wall variant (emoji, photo, note-only, bare) is visible.
  const activeContribs: ContribRow[] = [
    { id: id(), gift_id: giftIds.active, amount_cents: 5000, contributor_name: "Maya Chen", contributor_note: "Rock on, Jamie!", contributor_image_url: "/stock/fire_3d.png", contributor_email: "maya@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.active, amount_cents: 2500, contributor_name: "Devon Park", contributor_note: null, contributor_image_url: "/stock/star_3d.png", contributor_email: "devon@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.active, amount_cents: 10000, contributor_name: "Ari Goldberg", contributor_note: "Make some noise!! So overdue 🥁", contributor_image_url: null, contributor_email: "ari@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.active, amount_cents: 2500, contributor_name: null, contributor_note: "Anonymous high-five.", contributor_image_url: null, contributor_email: null, status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.active, amount_cents: 5000, contributor_name: "Priya Sharma", contributor_note: "Can't wait to hear the first solo.", contributor_image_url: "https://i.pravatar.cc/150?img=32", contributor_email: "priya@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.active, amount_cents: 2500, contributor_name: "Tom Becker", contributor_note: null, contributor_image_url: "/stock/rocket_3d.png", contributor_email: "tom@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
  ];

  // Funded gift contributions — fewer, larger
  const fundedContribs: ContribRow[] = [
    { id: id(), gift_id: giftIds.funded, amount_cents: 25000, contributor_name: "Aunt Linda", contributor_note: "For the rooftop dinner. Pictures, please!", contributor_image_url: "/stock/champagne_3d.png", contributor_email: "linda@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.funded, amount_cents: 50000, contributor_name: "Mom & Dad", contributor_note: "We love you both. Have the time of your lives.", contributor_image_url: "/stock/heart_3d.png", contributor_email: "parents@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.funded, amount_cents: 24000, contributor_name: "Kim & Theo", contributor_note: "Drinks at Park of Nations are on us 🥂", contributor_image_url: "/stock/cheers_3d.png", contributor_email: "kim@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.funded, amount_cents: 25000, contributor_name: "The Office", contributor_note: null, contributor_image_url: null, contributor_email: "office@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
  ];

  // Closed gift contributions — for nostalgia card wall
  const closedContribs: ContribRow[] = [
    { id: id(), gift_id: giftIds.closed, amount_cents: 50000, contributor_name: "Grandma", contributor_note: "Cook something special.", contributor_image_url: "/stock/ring_3d.png", contributor_email: "g@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.closed, amount_cents: 75000, contributor_name: "The Smiths", contributor_note: "Best wishes for the new chapter.", contributor_image_url: "https://i.pravatar.cc/150?img=15", contributor_email: "smiths@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
    { id: id(), gift_id: giftIds.closed, amount_cents: 90000, contributor_name: "Jules & Co", contributor_note: null, contributor_image_url: "/stock/champagne_3d.png", contributor_email: "jules@example.com", status: "succeeded", stripe_checkout_session_id: `cs_test_${id()}` },
  ];

  // The pending contribution that the success page will fulfill — pre-marked as succeeded
  // so fulfillCheckoutSession early-returns without hitting Stripe.
  const successSessionId = `cs_test_tour_success_${id()}`;
  const successAmount = 7500;
  const successContrib: ContribRow = {
    id: id(),
    gift_id: giftIds.active,
    amount_cents: successAmount,
    contributor_name: "You",
    contributor_note: "So glad to chip in 🎁",
    contributor_image_url: "/stock/party_3d.png",
    contributor_email: "you@example.com",
    status: "succeeded",
    stripe_checkout_session_id: successSessionId,
  };

  for (const c of [...activeContribs, ...fundedContribs, ...closedContribs, successContrib]) {
    await client.execute({
      sql: `INSERT INTO contributions (id, gift_id, amount_cents, currency, contributor_name, contributor_note, contributor_image_url, contributor_email, stripe_checkout_session_id, status, created_at) VALUES (?, ?, ?, 'usd', ?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.gift_id, c.amount_cents, c.contributor_name, c.contributor_note, c.contributor_image_url, c.contributor_email, c.stripe_checkout_session_id, c.status, now()],
    });
  }

  // ---- Reactions on a few of the active-gift contributions ----
  const reactionTargets = activeContribs.slice(0, 3);
  for (const c of reactionTargets) {
    await client.execute({
      sql: `INSERT INTO reactions (id, contribution_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [id(), c.id, organizer.id, "🔥", now()],
    });
  }
  await client.execute({
    sql: `INSERT INTO reactions (id, contribution_id, user_id, reaction_type, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id(), reactionTargets[0].id, organizer.id, "❤️", now()],
  });

  client.close();

  return {
    organizer: { ...organizer, email: "tour-organizer@giftaro.test", password: "tour-seed-password" },
    emptyOrganizer: { ...emptyOrganizer, email: "tour-empty@giftaro.test", password: "tour-seed-password" },
    gifts: giftIds,
    successContribution: { giftId: giftIds.active, sessionId: successSessionId, amountCents: successAmount },
  };
}
