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
          사이트 비밀번호처럼 설정한 <code>ADMIN_TOKEN</code>을 입력한 뒤, 폼에서 영웅 정보를 수정합니다.
        </p>
      </section>
      <AdminHeroEditor heroes={heroes} effects={catalog.effects} />
    </div>
  );
}
