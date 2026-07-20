import { CatalogTabs } from "@/components/catalog-tabs";
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
          <p className="catalog-eyebrow">SenaDB Encyclopedia</p>
          <h1>세븐나이츠 리버스 도감</h1>
          <p>
            영웅 정보를 먼저 제공하고, 펫과 장비 도감은 업데이트 준비 중입니다.
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
        <CatalogTabs heroes={heroes} />
      </section>
    </div>
  );
}
