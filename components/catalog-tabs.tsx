"use client";

import { useState } from "react";

import { HeroFilters } from "@/components/hero-filters";
import type { HeroSummary } from "@/lib/types";

type CatalogTab = "heroes" | "pets" | "equipment";

type Props = {
  heroes: HeroSummary[];
};

const tabs: Array<{ id: CatalogTab; label: string }> = [
  { id: "heroes", label: "영웅" },
  { id: "pets", label: "펫" },
  { id: "equipment", label: "장비" },
];

export function CatalogTabs({ heroes }: Props) {
  const [activeTab, setActiveTab] = useState<CatalogTab>("heroes");

  return (
    <>
      <div className="catalog-tabs" role="tablist" aria-label="도감 분류">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            data-active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "heroes" ? <HeroFilters heroes={heroes} /> : null}
      {activeTab === "pets" ? (
        <section className="catalog-coming-soon">
          <span>Pet Encyclopedia</span>
          <strong>펫 도감은 준비 중입니다.</strong>
          <p>펫 능력치와 보유 효과를 정리한 뒤 연결하겠습니다.</p>
        </section>
      ) : null}
      {activeTab === "equipment" ? (
        <section className="catalog-coming-soon">
          <span>Equipment Encyclopedia</span>
          <strong>장비 도감은 준비 중입니다.</strong>
          <p>장비 세트, 옵션, 추천 세팅 정보를 순차적으로 추가할 예정입니다.</p>
        </section>
      ) : null}
    </>
  );
}
