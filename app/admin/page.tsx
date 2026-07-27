import type { Metadata } from "next";

import { AdminHeroEditor } from "@/components/admin-hero-editor";
import catalogData from "@/content/hero-catalog.json";
import type { Effect, HeroDetail } from "@/lib/types";

type AdminHero = Omit<HeroDetail, "skills">;

const catalog = catalogData as unknown as {
  heroes: AdminHero[];
  effects: Effect[];
};

export const metadata: Metadata = {
  title: "백오피스",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const heroes = [...catalog.heroes].sort((left, right) => left.name.localeCompare(right.name, "ko"));

  return (
    <div className="admin-page">
      <section className="hero-panel admin-hero">
        <h1>세나DB 백오피스</h1>
      </section>
      <AdminHeroEditor heroes={heroes} effects={catalog.effects} />
    </div>
  );
}
