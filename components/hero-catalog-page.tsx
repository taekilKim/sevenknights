import { CatalogTabs } from "@/components/catalog-tabs";
import { getHeroes } from "@/lib/catalog";

export async function HeroCatalogPage() {
  const heroes = await getHeroes();

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="catalog-hero-copy">
          <h1>세븐나이츠 리버스 도감</h1>
        </div>
      </section>

      <section className="catalog-board">
        <CatalogTabs heroes={heroes} />
      </section>
    </div>
  );
}
