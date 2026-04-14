import Link from "next/link";

import { getHeroes } from "@/lib/airtable";

export default async function HomePage() {
  const heroes = await getHeroes();
  const highlighted = heroes.slice(0, 4);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="hero-panel page-hero">
        <div>
          <div className="badge-row" style={{ marginBottom: "14px" }}>
            <span className="pill">동적 프레임워크 전환 완료</span>
            <span className="pill">Next.js App Router</span>
          </div>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(2rem, 3vw, 3.4rem)", lineHeight: 1.05 }}>
            세븐나이츠 리버스 공략과 도감을
            <br />
            더 빠르고 유연한 구조로 옮겼습니다.
          </h1>
          <p className="muted" style={{ fontSize: "1.05rem", margin: 0, maxWidth: "60ch" }}>
            영웅 정보, 상세 공략, 티어 참고, 덱 구성 흐름을 App Router 기반으로 재구성했습니다.
            이제 목록과 상세가 서버에서 직접 데이터를 가져오고, 확장도 훨씬 쉬워졌습니다.
          </p>
          <div className="badge-row" style={{ marginTop: "22px" }}>
            <Link href="/heroes" className="button">
              영웅 도감 보기
            </Link>
            <Link href="/deck-builder" className="button secondary">
              덱 빌더 예정 화면
            </Link>
          </div>
        </div>
        <div className="section-card" style={{ display: "grid", gap: "12px", alignContent: "start" }}>
          <div className="section-heading">
            <h2>전환 핵심</h2>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            기존 정적 HTML + Express 조합 대신, 페이지 렌더와 API를 한 프레임워크 안으로 합쳤습니다.
          </p>
          <div className="badge-row">
            <span className="pill">Server Components</span>
            <span className="pill">Route Handlers</span>
            <span className="pill">Metadata API</span>
          </div>
        </div>
      </section>

      <section className="quick-links">
        <Link href="/heroes" className="quick-link">
          <strong>영웅 도감</strong>
          <span className="muted">필터와 검색으로 영웅 정보를 빠르게 탐색</span>
        </Link>
        <Link href="/tier-list" className="quick-link">
          <strong>티어표</strong>
          <span className="muted">콘텐츠별 메타 정보를 붙이기 좋은 동적 페이지 기반</span>
        </Link>
        <Link href="/deck-builder" className="quick-link">
          <strong>덱 빌더</strong>
          <span className="muted">후속으로 클라이언트 상호작용을 옮기기 좋은 형태</span>
        </Link>
        <Link href="/guides/beginner" className="quick-link">
          <strong>초보자 가이드</strong>
          <span className="muted">정적 문서와 동적 데이터 혼합 구성이 쉬워짐</span>
        </Link>
      </section>

      <section className="home-feed-grid">
        <div className="section-card feed-column">
          <div className="section-heading">
            <h2>대표 영웅</h2>
            <span className="muted">{heroes.length}명 로드</span>
          </div>
          <div className="hero-grid">
            {highlighted.map((hero) => (
              <Link key={hero.id} href={`/heroes/${hero.slug}`} className="hero-card">
                <div className="hero-card-portrait">
                  {hero.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.portrait} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </div>
                <div className="hero-card-copy">
                  <h3>{hero.name}</h3>
                  <p className="muted">{hero.type || "타입 준비 중"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="feed-column">
          <section className="feed-card">
            <div className="section-heading">
              <h3>왜 빨라지나</h3>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              정적 페이지가 브라우저에서 다시 API를 조합하던 구조를 줄이고, 서버 렌더 단계에서 필요한 데이터를 미리 준비합니다.
            </p>
          </section>
          <section className="feed-card">
            <div className="section-heading">
              <h3>다음 이전 대상</h3>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              티어표, 덱 빌더, FAQ, 초보자 가이드를 새 페이지로 순차 이전하면 전체 전환이 마무리됩니다.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
