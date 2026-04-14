import type { MetadataRoute } from "next";

import { getHeroes } from "@/lib/airtable";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const heroes = await getHeroes().catch(() => []);
  const now = new Date();

  return [
    {
      url: "https://senadb.games/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://senadb.games/heroes",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...heroes.map((hero) => ({
      url: `https://senadb.games/heroes/${hero.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
