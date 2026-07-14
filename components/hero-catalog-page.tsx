import { HeroFilters } from "@/components/hero-filters";
import { getHeroes } from "@/lib/catalog";

export async function HeroCatalogPage() {
  const heroes = await getHeroes();

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="hero-panel">
        <div className="section-heading">
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>세븐나이츠 리버스 영웅 도감</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              영웅 이름, 희귀도, 타입으로 필요한 정보를 바로 찾아보세요.
            </p>
          </div>
          <span className="pill">{heroes.length} Heroes</span>
        </div>
        <HeroFilters heroes={heroes} />
      </section>
    </div>
  );
}
