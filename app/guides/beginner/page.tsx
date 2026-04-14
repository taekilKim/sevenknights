import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "세나 리버스 초보자 가이드",
  description:
    "세븐나이츠 리버스를 처음 시작하는 유저를 위한 1주차~1개월차 성장 로드맵. 리세마라, 초반 육성, 자원 관리까지 정리했습니다.",
};

const starterConcepts = [
  "영웅 등급은 전설+ > 전설 > 희귀 순으로 강력합니다.",
  "공격형, 마법형, 방어형, 지원형, 만능형의 역할 차이를 먼저 익히는 것이 좋습니다.",
  "장비는 등급보다 세트와 옵션, 그리고 누가 착용하느냐가 더 중요할 때가 많습니다.",
  "같은 영웅을 활용한 초월은 장기적으로 전투력을 크게 좌우합니다.",
];

const weekPlan = [
  {
    title: "1주차",
    items: ["스토리 7장 전후까지 밀기", "주력 영웅 4성 승급", "기본 장비 세팅", "결투장 배치전 완료"],
  },
  {
    title: "2주차",
    items: ["파티 5명 틀 잡기", "장비 +12 전후 강화", "실버 티어 진입", "총력전 첫 참여"],
  },
  {
    title: "3주차",
    items: ["주력 영웅 5성 승급", "2초월 준비", "레이드 입문", "속공 기준 덱 조정"],
  },
  {
    title: "4주차",
    items: ["결투장 골드 티어 도전", "총력전 상위권 진입", "길드 콘텐츠 본격 참여", "신규 영웅 육성 분기점 정리"],
  },
];

export default function BeginnerGuidePage() {
  return (
    <div className="guide-stack">
      <section className="hero-panel">
        <div className="section-heading">
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>초보자 완벽 가이드</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              검색 유입을 가장 많이 받는 초심자 질문을 기준으로, 시작 직후부터 1개월차까지의 성장 흐름을 압축했습니다.
            </p>
          </div>
          <span className="pill">Guide</span>
        </div>
        <div className="badge-row">
          <span className="pill">리세마라</span>
          <span className="pill">초반 육성</span>
          <span className="pill">자원 관리</span>
          <span className="pill">1개월 로드맵</span>
        </div>
      </section>

      <section className="article-grid">
        <article className="guide-block">
          <h2 style={{ marginTop: 0 }}>1. 게임 시작 전</h2>
          <div className="info-box">
            <p>
              세븐나이츠 리버스는 영웅 수집과 조합, 장비 세팅, 속공 순서 최적화가 핵심인 RPG입니다.
              초반에는 모든 영웅을 키우기보다 주력 1~2명을 정하고 자원을 몰아주는 편이 훨씬 안정적입니다.
            </p>
          </div>
          <ul>
            {starterConcepts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="guide-block">
          <h2 style={{ marginTop: 0 }}>2. 리세마라 판단 기준</h2>
          <p className="muted">
            필수는 아니지만 시간이 허락한다면 전설+ 영웅 1명을 기준으로 출발하는 편이 좋습니다.
            전설 여러 장보다 전설+ 한 장이 초반 체감이 더 큰 경우가 많습니다.
          </p>
          <ol>
            <li>튜토리얼을 빠르게 완료하고 지급 소환권을 사용합니다.</li>
            <li>전설+ 핵심 영웅 또는 범용성이 높은 딜러/탱커가 나왔는지 봅니다.</li>
            <li>결과가 만족스럽다면 반드시 계정 연동을 먼저 합니다.</li>
          </ol>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>3. 초반 1주차 운영</h2>
        </div>
        <div className="timeline-item">
          <strong>Day 1-3</strong>
          <ul>
            <li>메인 스토리를 가능한 만큼 밀어 다이아와 재화를 확보합니다.</li>
            <li>주력 영웅을 먼저 레벨업하고 핵심 스킬이 열리는 구간까지 올립니다.</li>
            <li>장비 던전은 기본 장비 확보 목적 정도로만 접근합니다.</li>
          </ul>
        </div>
        <div className="timeline-item" style={{ marginTop: "16px" }}>
          <strong>Day 4-7</strong>
          <ul>
            <li>탱커 1, 딜러 2, 지원 1 기본 틀을 완성합니다.</li>
            <li>결투장과 총력전 등 보상형 콘텐츠에 최소 진입합니다.</li>
            <li>출석, 일일 퀘스트, 이벤트 미션은 빠짐없이 챙깁니다.</li>
          </ul>
        </div>
      </section>

      <section className="article-grid">
        <article className="guide-block">
          <h2 style={{ marginTop: 0 }}>4. 자원 관리 우선순위</h2>
          <ol>
            <li>다이아는 초반 영웅 확보에 우선 투자합니다.</li>
            <li>골드는 주력 영웅 장비 강화와 스킬 강화에 먼저 씁니다.</li>
            <li>희귀 장비에 과투자하지 말고, 전설급 장비 확보 이후 강화 폭을 키웁니다.</li>
            <li>중복 영웅은 무조건 분해하지 말고 초월 가치부터 확인합니다.</li>
          </ol>
        </article>

        <article className="guide-block">
          <h2 style={{ marginTop: 0 }}>5. 초반 실수 방지</h2>
          <ul>
            <li>여러 영웅을 동시에 키우지 않기</li>
            <li>희귀 장비에 과도한 강화 재화 쓰지 않기</li>
            <li>속공 세팅을 무시한 채 PVP에만 몰입하지 않기</li>
            <li>길드 가입과 이벤트 참여를 미루지 않기</li>
          </ul>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>6. 1개월 성장 로드맵</h2>
        </div>
        <div className="article-grid">
          {weekPlan.map((plan) => (
            <article key={plan.title} className="roadmap-card">
              <strong>{plan.title}</strong>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="callout">
        <h2 style={{ marginTop: 0 }}>다음 추천 동선</h2>
        <p>
          초보자 검색 유입은 이 가이드에서 받고, 세부 클릭은 <Link href="/heroes">영웅 도감</Link>과{" "}
          <Link href="/faq">FAQ</Link>로 흘려보내는 구조가 체류 시간과 페이지뷰를 늘리기 좋습니다.
        </p>
      </section>
    </div>
  );
}
