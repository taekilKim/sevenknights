import { HeroFilters } from "@/components/hero-filters";
import { getHeroes } from "@/lib/catalog";

export async function HeroCatalogPage() {
  const heroes = await getHeroes();
  const heroesWithSkills = heroes.filter((hero) => hero.skills.length > 0).length;
  const typeCount = new Set(heroes.map((hero) => hero.type).filter(Boolean)).size;
  const rarityCount = new Set(heroes.map((hero) => hero.rarity).filter(Boolean)).size;

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="catalog-hero-copy">
          <p className="catalog-eyebrow">Hero Encyclopedia</p>
          <h1>세븐나이츠 리버스 영웅 도감</h1>
          <p>
            이름, 별명, 희귀도, 타입으로 영웅을 빠르게 찾고 스킬 보유 상태와 핵심 정보를 한눈에 비교하세요.
          </p>
        </div>

        <div className="catalog-stats" aria-label="영웅 도감 요약">
          <div className="catalog-stat-card">
            <span>{heroes.length}</span>
            <strong>등록 영웅</strong>
          </div>
          <div className="catalog-stat-card">
            <span>{heroesWithSkills}</span>
            <strong>스킬 정보</strong>
          </div>
          <div className="catalog-stat-card">
            <span>{typeCount}</span>
            <strong>타입</strong>
          </div>
          <div className="catalog-stat-card">
            <span>{rarityCount}</span>
            <strong>희귀도</strong>
          </div>
        </div>
      </section>

      <section className="catalog-board">
        <HeroFilters heroes={heroes} />
      </section>
    </div>
  );
}
