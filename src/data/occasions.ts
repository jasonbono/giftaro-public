export type Occasion = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  recipient: string;
  occasion: string;
  typicalContribution: { lowUsd: number; highUsd: number };
  giftIdeas: string[];
  sampleMessage?: string;
  relatedSlugs?: string[];
};

// Add new rows here. They auto-publish to /group-gift/<slug> with full SEO
// wiring (sitemap, llms.txt, OG image, JSON-LD, breadcrumbs) on next deploy.
//
// NOTE: This public snapshot includes a single representative occasion to
// demonstrate the programmatic-SEO system. The full content set is omitted.
export const OCCASIONS: Occasion[] = [
  {
    slug: "kid-birthday-party",
    title: "Group gift for a kid's birthday party",
    shortDescription:
      "Skip the party-favor pile. Pool what your kid's friends would have spent into one thing your kid actually wants.",
    longDescription:
      "Instead of a stack of small gifts, name one thing the birthday kid actually wants and let contributors chip in any amount from their phone. Contributors feel good because they helped get something meaningful, the kid gets the thing, and the clutter pile never happens.",
    recipient: "kid",
    occasion: "birthday party",
    typicalContribution: { lowUsd: 15, highUsd: 40 },
    giftIdeas: [
      "A real bike or scooter the kid's been eyeing",
      "A Lego set above the usual price ceiling",
      "A music, art, or sports lesson package",
      "A trip to a trampoline park, climbing gym, or aquarium",
    ],
    sampleMessage:
      "We're trying something different this year. Instead of birthday gifts, we're pooling for one thing [Name] has been asking for — chip in any amount: [link].",
  },
];

const BY_SLUG = new Map<string, Occasion>(
  OCCASIONS.map((o) => [o.slug, o]),
);

export function listOccasions(): Occasion[] {
  return OCCASIONS;
}

export function occasionSlugs(): string[] {
  return OCCASIONS.map((o) => o.slug);
}

export function getOccasion(slug: string): Occasion | undefined {
  return BY_SLUG.get(slug);
}

export function occasionToProse(o: Occasion): string {
  const range = `$${o.typicalContribution.lowUsd}–$${o.typicalContribution.highUsd}`;
  const ideas = o.giftIdeas.length > 0
    ? `\n\nGift ideas:\n${o.giftIdeas.map((g) => `- ${g}`).join("\n")}`
    : "";
  const sample = o.sampleMessage ? `\n\nSample share message: ${o.sampleMessage}` : "";
  return `${o.longDescription}\n\nTypical contribution per person: ${range}.${ideas}${sample}`;
}
