import type { Metadata } from "next";

import { AdminHeroEditor } from "@/components/admin-hero-editor";
import catalogData from "@/content/hero-catalog.json";
import type { HeroDetail } from "@/lib/types";

type AdminHero = Omit<HeroDetail, "skills">;

const catalog = catalogData as unknown as {
  heroes: AdminHero[];
};

export const metadata: Metadata = {
  title: "영웅 데이터 어드민",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminHeroesPage() {
  const heroes = [...catalog.heroes].sort((left, right) => left.name.localeCompare(right.name, "ko"));

  return (
    <div className="admin-page">
      <section className="hero-panel admin-hero">
        <p className="catalog-eyebrow">Admin</p>
        <h1>영웅 데이터 편집</h1>
        <p className="muted">
          영웅 JSON을 직접 수정합니다. 저장 API는 <code>ADMIN_TOKEN</code>으로 보호됩니다.
        </p>
      </section>
      <AdminHeroEditor heroes={heroes} />
    </div>
  );
}
