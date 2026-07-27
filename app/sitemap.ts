import type { MetadataRoute } from "next";

import { getHeroes } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const heroes = await getHeroes().catch(() => []);
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://senadb.games/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://senadb.games/heroes",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: "https://senadb.games/deck-builder",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://senadb.games/tier-list",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://senadb.games/guides/arena-decks",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://senadb.games/guides/beginner",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://senadb.games/faq",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  return [
    ...staticPages,
    ...heroes.map((hero) => ({
      url: `https://senadb.games/heroes/${hero.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
