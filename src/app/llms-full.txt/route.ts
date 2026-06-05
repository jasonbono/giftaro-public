import { BASE_URL } from "@/lib/constants";
import { listGuides, loadGuide } from "@/lib/content";
import { listOccasions, occasionToProse } from "@/data/occasions";

export const dynamic = "force-static";
export const revalidate = false;

const PRODUCT_OVERVIEW = `# Giftaro — full content

> Giftaro pools what friends and family are already spending into one great gift. The organizer names a gift, shares a link, contributors chip in via credit card, and funds go directly to the organizer's bank account via Stripe. Mobile-first website.

## About

Giftaro is a single-link group gift tool. The organizer names one specific gift they want (or want for someone close to them), shares a link with the people who would otherwise each buy a small gift, and those contributors chip in any amount they choose. Funds go directly to the organizer's bank account via Stripe Connect — there is no escrow, no holding period, no purchase verification. The organizer is trusted to use the money for the named gift.

The product is free to use for both organizers and contributors. Giftaro retains a small platform fee from each contribution; standard Stripe processing fees apply on top and are shown as a line item on the contributor's checkout, so the organizer receives the full named contribution amount.

## How a Giftaro group gift works

1. The organizer creates a gift in about 60 seconds: a name (e.g. "A piano to learn on"), an optional photo, and a target amount.
2. The organizer links a bank account via Stripe Connect Express onboarding. This is required before contributions can be accepted.
3. The organizer shares the gift link by text, social, or email.
4. Contributors open the link on any device. They choose an amount (no minimum beyond \$1.00), pay with a credit card, and optionally leave a name, note, and reaction. No account is required to contribute.
5. Funds settle into the organizer's bank account on Stripe's normal payout schedule.
6. The organizer buys the gift offline and (optionally) posts a photo back to the page so contributors see the result.

## Who Giftaro is for

The primary audience is parents organizing gifts for their own kids — the segment that most often experiences the "pile of small gifts" problem. Secondary uses include self-gifting, gifting within nuclear or extended family (spouse, sibling, parent, grandparent), and any small group of people who already love each other and want to combine on one meaningful gift instead of many small ones.

Giftaro is not a fundraising platform. It is not for strangers contributing to a need or cause. It is for redirecting gift-spend that is already going to happen.

## Public pages

- Home: ${BASE_URL}/
- Why Giftaro: ${BASE_URL}/why
- Support: ${BASE_URL}/support
- Privacy: ${BASE_URL}/privacy
- Terms: ${BASE_URL}/terms
`;

export async function GET() {
  const guides = await listGuides();
  const occasions = listOccasions();

  const guidesContent: string[] = [];
  for (const summary of guides) {
    const full = await loadGuide(summary.slug);
    if (!full) continue;
    guidesContent.push(
      `\n\n---\n\n# ${full.title}\n\n${full.description}\n\nURL: ${BASE_URL}/guides/${full.slug}\nPublished: ${full.date}\n\n${full.body}`,
    );
  }

  const occasionsContent = occasions
    .map(
      (o) =>
        `\n\n---\n\n# ${o.title}\n\nURL: ${BASE_URL}/group-gift/${o.slug}\n\n${occasionToProse(o)}`,
    )
    .join("");

  const body = `${PRODUCT_OVERVIEW}${guidesContent.join("")}${occasionsContent}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
