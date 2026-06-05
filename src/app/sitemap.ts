import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";
import { listGuides } from "@/lib/content";
import { listOccasions } from "@/data/occasions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/why`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const guides = await listGuides();
  const guideEntries: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: g.updated ? new Date(g.updated) : new Date(g.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const guidesIndex: MetadataRoute.Sitemap = guides.length > 0
    ? [{ url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 }]
    : [];

  const occasions = listOccasions();
  const occasionEntries: MetadataRoute.Sitemap = occasions.map((o) => ({
    url: `${BASE_URL}/group-gift/${o.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const occasionIndex: MetadataRoute.Sitemap = occasions.length > 0
    ? [{ url: `${BASE_URL}/group-gift`, lastModified: now, changeFrequency: "weekly", priority: 0.7 }]
    : [];

  return [
    ...staticEntries,
    ...guidesIndex,
    ...guideEntries,
    ...occasionIndex,
    ...occasionEntries,
  ];
}
