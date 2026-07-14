import { redirect } from "next/navigation";

import { getHeroByName } from "@/lib/catalog";

type Props = {
  searchParams: Promise<{ name?: string }>;
};

export default async function LegacyHeroPage({ searchParams }: Props) {
  const { name } = await searchParams;

  if (!name) {
    redirect("/heroes");
  }

  const hero = await getHeroByName(name);
  if (!hero) {
    redirect("/heroes");
  }

  redirect(`/heroes/${hero.slug}`);
}
