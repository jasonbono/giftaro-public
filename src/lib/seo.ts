import { BASE_URL } from "@/lib/constants";

export const SITE_NAME = "Giftaro";
export const SITE_TAGLINE = "One great gift.";
export const SITE_DESCRIPTION =
  "Skip the pile of stuff. Get one great gift. Name your gift, share the link, everyone chips in.";
export const ORGANIZATION_LEGAL_NAME = "[Company]";
export const SUPPORT_EMAIL = "support@giftaro.app";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalized}`;
}

type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [k: string]: JsonLdValue };

export function organizationSchema(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}#organization`,
    name: SITE_NAME,
    legalName: ORGANIZATION_LEGAL_NAME,
    url: BASE_URL,
    logo: absoluteUrl("/icon.png"),
    email: SUPPORT_EMAIL,
    description: SITE_DESCRIPTION,
    sameAs: [],
  };
}

export function websiteSchema(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}#website`,
    url: BASE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${BASE_URL}#organization` },
    inLanguage: "en-US",
  };
}

export function webApplicationSchema(): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${BASE_URL}#webapp`,
    name: SITE_NAME,
    url: BASE_URL,
    description:
      "Giftaro pools what friends and family are already spending into one great gift. The organizer names a gift, shares a link, and contributors chip in via credit card. Funds go directly to the organizer.",
    applicationCategory: "LifestyleApplication",
    applicationSubCategory: "Group Gifting",
    operatingSystem: "Any (web)",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        "Free for organizers and contributors. Giftaro retains a small platform fee from contributions; standard Stripe processing fees apply on top and are shown as a line item at checkout.",
    },
    featureList: [
      "Create one gift link in 60 seconds",
      "No account required for contributors to chip in",
      "Funds go directly to the organizer's bank account via Stripe",
      "Mobile-first, share by text or social",
      "Photos, contributor notes, and reactions on every gift page",
    ],
    publisher: { "@id": `${BASE_URL}#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function articleSchema(args: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title,
    description: args.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(args.url) },
    url: absoluteUrl(args.url),
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    author: {
      "@type": args.author ? "Person" : "Organization",
      name: args.author ?? SITE_NAME,
    },
    publisher: { "@id": `${BASE_URL}#organization` },
    image: args.image ? absoluteUrl(args.image) : absoluteUrl("/opengraph-image"),
    inLanguage: "en-US",
  };
}

export function faqSchema(items: { question: string; answer: string }[]): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function howToSchema(args: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}): JsonLdValue {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: args.name,
    description: args.description,
    step: args.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function jsonLdScript(data: JsonLdValue | JsonLdValue[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
