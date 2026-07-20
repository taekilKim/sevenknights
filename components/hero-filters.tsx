"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import type { HeroSummary } from "@/lib/types";

type Props = {
  heroes: HeroSummary[];
};

const rarityClassMap: Record<string, string> = {
  "전설+": "rarity-legendary-plus",
  전설: "rarity-legendary",
  희귀: "rarity-rare",
};

export function HeroFilters({ heroes }: Props) {
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("전체");
  const [type, setType] = useState("전체");
  const deferredSearch = useDeferredValue(search);

  const rarities = useMemo(
    () => ["전체", ...Array.from(new Set(heroes.map((hero) => hero.rarity).filter(Boolean)))],
    [heroes],
  );
  const types = useMemo(
    () => ["전체", ...Array.from(new Set(heroes.map((hero) => hero.type).filter(Boolean)))],
    [heroes],
  );

  const filtered = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return heroes.filter((hero) => {
      const matchesSearch =
        keyword.length === 0 ||
        hero.name.toLowerCase().includes(keyword) ||
        (hero.nickname || "").toLowerCase().includes(keyword);
      const matchesRarity = rarity === "전체" || hero.rarity === rarity;
      const matchesType = type === "전체" || hero.type === type;

      return matchesSearch && matchesRarity && matchesType;
    });
  }, [deferredSearch, heroes, rarity, type]);

  const resetFilters = () => {
    setSearch("");
    setRarity("전체");
    setType("전체");
  };

  return (
    <>
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <label htmlFor="hero-search">영웅 검색</label>
          <div className="catalog-search-box">
            <span aria-hidden="true">⌕</span>
            <input
              id="hero-search"
              placeholder="이름 또는 별명으로 찾기"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="catalog-filter-groups">
          <div className="catalog-filter-group" aria-label="희귀도 필터">
            <span>희귀도</span>
            <div>
              {rarities.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="filter-chip"
                  data-active={rarity === item}
                  onClick={() => setRarity(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="catalog-filter-group" aria-label="타입 필터">
            <span>타입</span>
            <div>
              {types.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="filter-chip"
                  data-active={type === item}
                  onClick={() => setType(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="catalog-result-bar">
          <p>
            <strong>{filtered.length}</strong>명의 영웅
          </p>
          <button type="button" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="catalog-grid">
          {filtered.map((hero) => {
            const rarityClass = hero.rarity ? rarityClassMap[hero.rarity] : undefined;

            return (
              <Link
                key={hero.id}
                href={`/heroes/${hero.slug}`}
                className={["catalog-card", rarityClass].filter(Boolean).join(" ")}
              >
                <div className="catalog-card-art">
                  {hero.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.portrait} alt={hero.name} />
                  ) : null}
                  <div className="catalog-card-shine" />
                  {hero.rarity ? <span className="rarity-badge">{hero.rarity}</span> : null}
                </div>

                <div className="catalog-card-body">
                  <div className="catalog-card-title">
                    <div>
                      <h3>{hero.name}</h3>
                      {hero.nickname ? <p>{hero.nickname}</p> : null}
                    </div>
                    {hero.typeImage ? (
                      <span className="type-icon">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={hero.typeImage} alt={hero.type} />
                      </span>
                    ) : null}
                  </div>

                  <div className="catalog-card-meta">
                    {hero.type ? <span>{hero.type}</span> : null}
                    {hero.group ? <span>{hero.group}</span> : null}
                  </div>

                  <div className="catalog-card-footer">
                    <span>{hero.skills.length > 0 ? `${hero.skills.length}개 스킬` : "스킬 준비 중"}</span>
                    <strong>상세 보기</strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <strong>조건에 맞는 영웅이 없습니다.</strong>
          <span>검색어를 줄이거나 필터를 초기화해 보세요.</span>
        </div>
      )}
    </>
  );
}
