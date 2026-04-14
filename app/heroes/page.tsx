import type { Metadata } from "next";

import { HeroFilters } from "@/components/hero-filters";
import { getHeroes } from "@/lib/airtable";

export const metadata: Metadata = {
  title: "영웅 도감",
  description: "세븐나이츠 리버스 모든 영웅의 희귀도, 타입, 스킬 정보를 필터와 검색으로 확인하세요.",
};

export default async function HeroesPage() {
  const heroes = await getHeroes();

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="hero-panel">
        <div className="section-heading">
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>영웅 도감</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              서버에서 직접 불러온 영웅 데이터를 바탕으로 빠르게 탐색할 수 있습니다.
            </p>
          </div>
          <span className="pill">{heroes.length} Heroes</span>
        </div>
        <HeroFilters heroes={heroes} />
      </section>
    </div>
  );
}
