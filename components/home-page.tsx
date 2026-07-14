import Link from "next/link";

import { getHeroes } from "@/lib/catalog";

const searchTopics = [
  {
    href: "/guides/arena-decks",
    label: "결투장 덱 추천",
    description: "상위 유입 키워드에 맞춘 덱 조합과 운영 흐름",
  },
  {
    href: "/tier-list",
    label: "티어표",
    description: "노출은 높고 CTR 개선 여지가 큰 핵심 페이지",
  },
  {
    href: "/guides/beginner",
    label: "초보자 가이드",
    description: "처음 들어온 유저가 바로 다음 행동을 고를 수 있는 입문 동선",
  },
  {
    href: "/heroes",
    label: "영웅 도감",
    description: "스탯, 타입, 스킬 정보를 검색하는 데이터 허브",
  },
];

export async function HomePage() {
  const heroes = await getHeroes();
  const linkedHeroes = heroes.filter((hero) => hero.skills.length > 0);
  const featuredHeroes = linkedHeroes.slice(0, 4);

  return (
    <div className="content-stack">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Seven Knights Re:Birth Guide Hub</p>
          <h1>세나 리버스 공략을 검색 흐름대로 다시 정리했습니다</h1>
          <p className="muted">
            결투장 덱 추천, 티어표, 초보자 가이드, 영웅 도감으로 이어지는 구조입니다. 에어테이블 호출 없이
            로컬 카탈로그와 CDN 이미지로 빠르게 열리도록 바꿨습니다.
          </p>
          <div className="home-actions">
            <Link href="/guides/arena-decks" className="button">
              결투장 덱 보기
            </Link>
            <Link href="/heroes" className="button secondary">
              영웅 도감 열기
            </Link>
          </div>
        </div>

        <div className="home-snapshot" aria-label="도감 연결 상태">
          <div>
            <span className="metric-value">{heroes.length}</span>
            <span className="metric-label">등록 영웅</span>
          </div>
          <div>
            <span className="metric-value">{linkedHeroes.length}</span>
            <span className="metric-label">스킬 연결 완료</span>
          </div>
          <div>
            <span className="metric-value">0</span>
            <span className="metric-label">Airtable 호출</span>
          </div>
        </div>
      </section>

      <section className="quick-links" aria-label="주요 콘텐츠">
        {searchTopics.map((topic) => (
          <Link key={topic.href} href={topic.href} className="quick-link">
            <strong>{topic.label}</strong>
            <span className="muted">{topic.description}</span>
          </Link>
        ))}
      </section>

      <section className="home-feed-grid">
        <div className="section-card">
          <div className="section-heading">
            <h2>검색 유입 우선순위</h2>
          </div>
          <div className="feed-column">
            <article className="feed-card">
              <strong>결투장 덱 추천</strong>
              <p className="muted">
                클릭과 전환 의도가 가장 분명한 키워드라 홈에서 첫 번째 행동으로 배치했습니다.
              </p>
            </article>
            <article className="feed-card">
              <strong>티어표</strong>
              <p className="muted">
                노출은 높지만 클릭률이 낮아 제목, 설명, 내부 링크를 계속 개선할 핵심 페이지입니다.
              </p>
            </article>
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <h2>도감 미리보기</h2>
            <Link href="/heroes" className="muted">
              전체 보기
            </Link>
          </div>
          <div className="compact-hero-list">
            {featuredHeroes.map((hero) => (
              <Link key={hero.id} href={`/heroes/${hero.slug}`} className="compact-hero">
                <span className="compact-portrait">
                  {hero.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.portrait} alt={hero.name} />
                  ) : null}
                </span>
                <span>
                  <strong>{hero.name}</strong>
                  <span className="muted">{hero.type || hero.rarity}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
