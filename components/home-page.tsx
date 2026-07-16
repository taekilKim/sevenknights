import Link from "next/link";

import { getHeroes } from "@/lib/catalog";

const searchTopics = [
  {
    href: "/guides/arena-decks",
    label: "결투장 덱 추천",
    description: "속공, 탱커, 지원형을 조합하는 실전 덱 구성",
  },
  {
    href: "/tier-list",
    label: "티어표",
    description: "현재 메타에서 먼저 키울 영웅 우선순위",
  },
  {
    href: "/guides/beginner",
    label: "초보자 가이드",
    description: "리세마라, 초반 육성, 자원 관리 입문서",
  },
  {
    href: "/heroes",
    label: "영웅 도감",
    description: "스탯, 타입, 스킬 정보를 한눈에 확인",
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
          <h1>세나 리버스 영웅·덱·티어 정보를 한곳에서 확인하세요</h1>
          <p className="muted">
            결투장 덱 추천부터 티어표, 초보자 가이드, 영웅 도감까지 필요한 공략 정보를 빠르게 찾아볼 수
            있습니다.
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
            <span className="metric-label">스킬 정보</span>
          </div>
          <div>
            <span className="metric-value">4</span>
            <span className="metric-label">핵심 공략</span>
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
            <h2>추천 공략</h2>
          </div>
          <div className="feed-column">
            <article className="feed-card">
              <strong>결투장 덱 추천</strong>
              <p className="muted">
                속공 순서와 역할 배분을 기준으로 결투장 조합을 빠르게 점검할 수 있습니다.
              </p>
            </article>
            <article className="feed-card">
              <strong>티어표</strong>
              <p className="muted">
                보유 영웅 중 누구를 먼저 키울지 판단할 때 참고하기 좋은 우선순위 가이드입니다.
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
