import "server-only";

import { cache } from "react";

import catalogData from "@/content/hero-catalog.json";
import type { Effect, HeroDetail, HeroSummary, Skill } from "@/lib/types";

type CatalogHero = Omit<HeroDetail, "skills">;

const catalog = catalogData as unknown as {
  heroes: CatalogHero[];
  effects: Effect[];
};

function heroSkills(hero: CatalogHero): Skill[] {
  return [hero.attack, hero.active_1, hero.active_2, hero.passive].filter((skill): skill is Skill => Boolean(skill));
}

function toSummary(hero: CatalogHero): HeroSummary {
  return {
    id: hero.id,
    name: hero.name,
    slug: hero.slug,
    nickname: hero.nickname,
    rarity: hero.rarity,
    type: hero.type,
    group: hero.group,
    hasEffect: hero.hasEffect,
    portrait: hero.portrait,
    typeImage: hero.typeImage,
    skills: heroSkills(hero),
  };
}

function toDetail(hero: CatalogHero): HeroDetail {
  return { ...hero, skills: heroSkills(hero) };
}

export const getHeroes = cache(async (): Promise<HeroSummary[]> =>
  catalog.heroes.map(toSummary).sort((left, right) => left.name.localeCompare(right.name, "ko")),
);

export const getEffects = cache(async (): Promise<Effect[]> => catalog.effects);

export const getHeroById = cache(async (id: string): Promise<HeroDetail | null> => {
  const hero = catalog.heroes.find((entry) => entry.id === id);
  return hero ? toDetail(hero) : null;
});

export const getHeroByName = cache(async (name: string): Promise<HeroDetail | null> => {
  const hero = catalog.heroes.find((entry) => entry.name === name);
  return hero ? toDetail(hero) : null;
});

export const getHeroBySlug = cache(async (slug: string): Promise<HeroDetail | null> => {
  const encodedSlug = encodeURIComponent(slug);
  const hero = catalog.heroes.find((entry) => entry.slug === slug || entry.slug === encodedSlug || entry.name === slug);
  return hero ? toDetail(hero) : null;
});
