import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "세븐나이츠 리버스 결투장 덱 추천",
  description:
    "세븐나이츠 리버스 결투장 덱 추천과 구성 원리 정리. 공덱, 방덱, 속공 중심 조합과 초보자용 안정 조합을 확인하세요.",
};

const deckSections = [
  {
    title: "속공 선점형",
    body: "선버프와 선광역기를 노리는 구조입니다. 속공 세팅과 첫 턴 스킬 순서가 매우 중요합니다.",
  },
  {
    title: "안정 운영형",
    body: "탱커와 지원을 두껍게 두고 상대 핵심 스킬을 흘리는 방식입니다. 승률은 안정적이지만 전투 시간이 길어질 수 있습니다.",
  },
  {
    title: "초보자 진입형",
    body: "희귀도보다 조합 완성도를 우선해서 쉽게 맞출 수 있는 구조를 추천합니다. 범용 영웅 중심으로 짜는 편이 좋습니다.",
  },
];

export default function ArenaDeckGuidePage() {
  return (
    <div className="guide-stack">
      <section className="hero-panel">
        <div className="section-heading">
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>세븐나이츠 리버스 결투장 덱 추천</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              네이버 상위 검색어에서 가장 직접적인 수요가 보이는 키워드라, 별도 랜딩으로 분리했습니다.
            </p>
          </div>
          <span className="pill">상위 검색어 대응</span>
        </div>
        <div className="badge-row">
          <span className="pill">결투장 덱</span>
          <span className="pill">세나 리버스 덱 추천</span>
          <span className="pill">초보자용 조합</span>
        </div>
      </section>

      <section className="article-grid">
        {deckSections.map((section) => (
          <article key={section.title} className="guide-block">
            <h2 style={{ marginTop: 0 }}>{section.title}</h2>
            <p className="muted">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>결투장 덱 구성 원칙</h2>
        </div>
        <ol>
          <li>탱커 1~2, 딜러 2~3, 지원 1~2의 균형을 먼저 맞춥니다.</li>
          <li>속공 기준으로 첫 턴 스킬 순서를 설계합니다.</li>
          <li>부활, 해제, 보호막, 방깎처럼 승패를 흔드는 축을 반드시 하나 이상 넣습니다.</li>
          <li>상대 메타가 빠르면 생존보다 선행동, 느리면 운영형 구성이 유리합니다.</li>
        </ol>
      </section>

      <section className="callout">
        <h2 style={{ marginTop: 0 }}>연결 동선</h2>
        <p>
          덱 추천 검색 유입은 <Link href="/heroes">영웅 도감</Link>과 <Link href="/tier-list">티어표</Link>로 분기시키는
          편이 가장 자연스럽습니다. 이후 실제 덱 DB가 생기면 이 페이지를 허브로 두고 덱 상세 페이지로 확장하면 됩니다.
        </p>
      </section>
    </div>
  );
}
