"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { HeroSummary } from "@/lib/types";

type Props = {
  heroes: HeroSummary[];
};

export function HeroFilters({ heroes }: Props) {
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("전체");
  const [type, setType] = useState("전체");

  const rarities = useMemo(
    () => ["전체", ...Array.from(new Set(heroes.map((hero) => hero.rarity).filter(Boolean)))],
    [heroes],
  );
  const types = useMemo(
    () => ["전체", ...Array.from(new Set(heroes.map((hero) => hero.type).filter(Boolean)))],
    [heroes],
  );

  const filtered = useMemo(() => {
    return heroes.filter((hero) => {
      const matchesSearch =
        search.trim().length === 0 ||
        hero.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (hero.nickname || "").toLowerCase().includes(search.trim().toLowerCase());
      const matchesRarity = rarity === "전체" || hero.rarity === rarity;
      const matchesType = type === "전체" || hero.type === type;

      return matchesSearch && matchesRarity && matchesType;
    });
  }, [heroes, rarity, search, type]);

  return (
    <>
      <div className="filters">
        <div className="filter-card">
          <label htmlFor="hero-search">영웅 검색</label>
          <input
            id="hero-search"
            placeholder="이름 또는 별명으로 찾기"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="filter-card">
          <label htmlFor="hero-rarity">희귀도</label>
          <select id="hero-rarity" value={rarity} onChange={(event) => setRarity(event.target.value)}>
            {rarities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-card">
          <label htmlFor="hero-type">타입</label>
          <select id="hero-type" value={type} onChange={(event) => setType(event.target.value)}>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="hero-grid">
          {filtered.map((hero) => (
            <Link key={hero.id} href={`/heroes/${hero.slug}`} className="hero-card">
              <div className="hero-card-portrait">
                {hero.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero.portrait} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
              </div>
              <div className="hero-card-copy">
                <h3>{hero.name}</h3>
                {hero.nickname ? <p className="muted">{hero.nickname}</p> : null}
                <div className="badge-row">
                  {hero.rarity ? <span className="pill">{hero.rarity}</span> : null}
                  {hero.type ? <span className="pill">{hero.type}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">조건에 맞는 영웅이 없습니다.</div>
      )}
    </>
  );
}
