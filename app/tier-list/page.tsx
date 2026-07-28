import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "세나 리버스 티어표",
  description:
    "세븐나이츠 리버스 티어표와 등급별 평가 기준 정리. 결투장, 초보자 추천, 범용성 높은 영웅을 빠르게 확인하세요.",
  alternates: {
    canonical: "/tier-list",
  },
};

const tierHighlights = [
  {
    title: "S 티어",
    description: "현재 메타에서 범용성과 성능이 모두 높은 영웅군입니다. 결투장과 주요 콘텐츠에서 우선 투자 후보로 봅니다.",
  },
  {
    title: "A 티어",
    description: "조합과 콘텐츠에 따라 충분히 강력한 픽입니다. 보유 풀이 좁을 때 대체 자원으로 매우 좋습니다.",
  },
  {
    title: "초보자 추천",
    description: "단순 성능보다 육성 효율과 범용성을 기준으로 선별한 스타터 픽입니다.",
  },
];

export default function TierListPage() {
  return (
    <div className="content-stack">
      <section className="hero-panel">
        <div className="section-heading">
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>세나 리버스 티어표</h1>
          </div>
        </div>
      </section>

      <section className="article-grid">
        {tierHighlights.map((item) => (
          <article key={item.title} className="guide-block">
            <h2 style={{ marginTop: 0 }}>{item.title}</h2>
            <p className="muted">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>티어표 보는 법</h2>
        </div>
        <ol>
          <li>S 티어는 현재 메타와 범용성 기준으로 투자 우선순위가 가장 높습니다.</li>
          <li>A 티어는 조합에 따라 S에 가까운 효율을 낼 수 있는 영웅입니다.</li>
          <li>초보자 추천은 획득 난이도, 투자 효율, 콘텐츠 적응력을 함께 봅니다.</li>
        </ol>
      </section>

      <section className="callout">
        <h2 style={{ marginTop: 0 }}>같이 보면 좋은 페이지</h2>
        <p>
          티어표에서 끝나지 않도록 <Link href="/guides/arena-decks">결투장 덱 추천</Link>,{" "}
          <Link href="/guides/beginner">초보자 가이드</Link>, <Link href="/heroes">영웅 도감</Link>도 함께 확인해 보세요.
        </p>
      </section>
    </div>
  );
}
