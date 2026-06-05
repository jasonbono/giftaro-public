import { BASE_URL } from "@/lib/constants";
import { listGuides } from "@/lib/content";
import { listOccasions } from "@/data/occasions";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const guides = await listGuides();
  const occasions = listOccasions();

  const guidesSection =
    guides.length > 0
      ? guides
          .map(
            (g) =>
              `- [${g.title}](${BASE_URL}/guides/${g.slug}): ${g.description}`,
          )
          .join("\n")
      : "(none yet)";

  const occasionsSection =
    occasions.length > 0
      ? occasions
          .map(
            (o) =>
              `- [${o.title}](${BASE_URL}/group-gift/${o.slug}): ${o.shortDescription}`,
          )
          .join("\n")
      : "(none yet)";

  const body = `# Giftaro

> Giftaro pools what friends and family are already spending into one great gift. The organizer names a gift, shares a link, contributors chip in via credit card, and funds go directly to the organizer's bank account via Stripe. Mobile-first website.

Giftaro is free for both organizers and contributors. Giftaro retains a small platform fee from each contribution; standard Stripe processing fees apply on top and are shown as a line item on the contributor's checkout. Funds go directly to the organizer's bank account — there is no escrow, no purchase verification, no waiting period.

## How it works

- Organizer creates a gift link in about 60 seconds (name, optional photo, target amount).
- Organizer links a bank account via Stripe Connect (Express onboarding).
- Contributors visit the link, choose any amount, and pay via credit card. No account required to contribute.
- Funds land in the organizer's bank account; the organizer buys the gift offline.
- Contributors can leave a note and a reaction; the organizer can post a photo of the final gift back to the page.

## Why it exists

Giftaro is for redirecting gift-giving energy that's already going to happen. Instead of multiple people each buying small gifts that pile up, contributions pool into one gift the recipient actually wants. It is not a fundraising platform — it is closer to a single-item gift registry, with funds going directly to the recipient's chosen organizer rather than a retailer.

## Public pages

- [Home](${BASE_URL}/): Product overview and example gifts.
- [Why Giftaro](${BASE_URL}/why): The "pile of small gifts" problem Giftaro solves.
- [Support](${BASE_URL}/support): Contact support@giftaro.app.
- [Privacy](${BASE_URL}/privacy): Privacy policy.
- [Terms](${BASE_URL}/terms): Terms of service.

## Guides

${guidesSection}

## Group gift occasion pages

${occasionsSection}

## Optional

- [Full content (llms-full.txt)](${BASE_URL}/llms-full.txt): All public pages concatenated.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
