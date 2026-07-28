import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "세나 리버스 FAQ",
  description:
    "세븐나이츠 리버스 자주 묻는 질문 정리. 리세마라, 무과금, 영웅 육성, 장비, 결투장 덱까지 한 번에 확인하세요.",
  alternates: {
    canonical: "/faq",
  },
};

const faqItems = [
  {
    category: "초보자",
    question: "세나 리버스는 어떤 게임인가요?",
    answer:
      "세븐나이츠 리버스는 다양한 영웅을 수집하고 육성해 결투장, 레이드, 각종 PvE 콘텐츠를 공략하는 모바일 RPG입니다. 영웅 조합과 속공, 장비 세트 선택이 성능에 큰 영향을 줍니다.",
  },
  {
    category: "초보자",
    question: "리세마라는 필수인가요?",
    answer:
      "필수는 아니지만, 초반 진행 속도 차이가 크기 때문에 시간 여유가 있다면 추천합니다. 전설+ 영웅 1명을 기준으로 시작하면 투자 효율이 확실히 좋아집니다.",
  },
  {
    category: "과금",
    question: "무과금으로도 즐길 수 있나요?",
    answer:
      "가능합니다. 다만 성장 속도는 느려서 자원 분배와 영웅 우선순위를 더 신중하게 가져가야 합니다. 출석, 이벤트, 일일 퀘스트의 누적 가치가 큽니다.",
  },
  {
    category: "영웅",
    question: "첫 SSR 선택권으로 누구를 골라야 하나요?",
    answer:
      "PVP 위주라면 탱커나 지원형, PVE 위주라면 범용 딜러가 안정적입니다. 현재 메타와 보유 영웅에 따라 우선순위가 달라지므로 티어표와 영웅 상세를 함께 보는 편이 좋습니다.",
  },
  {
    category: "전투/덱",
    question: "결투장 덱은 어떻게 구성하나요?",
    answer:
      "기본 틀은 탱커 1~2, 딜러 2~3, 지원 1~2입니다. 속공 순서, 광역기 진입 타이밍, 부활/해제/보호막 유무가 결과를 크게 좌우합니다.",
  },
  {
    category: "전투/덱",
    question: "속공이 왜 중요한가요?",
    answer:
      "속공은 행동 순서를 결정합니다. 선제 버프나 디버프, 핵심 광역기 타이밍이 선점되면 PVP 승률이 크게 달라집니다.",
  },
  {
    category: "장비",
    question: "장비 강화는 언제부터 하는 게 좋은가요?",
    answer:
      "전설급 이상 장비를 확보한 뒤 주력 영웅부터 강화하는 편이 좋습니다. 초반 희귀 장비에 과투자하면 교체 시점에 손해가 커집니다.",
  },
  {
    category: "영웅",
    question: "중복 영웅은 어떻게 활용하나요?",
    answer:
      "핵심 영웅은 초월 재료 가치가 매우 큽니다. 저티어 중복은 육성 계획을 본 뒤 분해나 보조 육성 재료로 쓰는 편이 효율적입니다.",
  },
];

export default function FaqPage() {
  return (
    <div className="content-stack">
      <section className="hero-panel">
        <div className="section-heading">
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 3vw, 3rem)" }}>자주 묻는 질문</h1>
          </div>
        </div>
      </section>

      <section className="faq-stack">
        {faqItems.map((item) => (
          <details key={item.question} className="faq-item-card" open>
            <summary>
              [{item.category}] {item.question}
            </summary>
            <p className="muted" style={{ marginTop: "12px" }}>
              {item.answer}
            </p>
          </details>
        ))}
      </section>

      <section className="callout">
        <h2 style={{ marginTop: 0 }}>더 깊게 보고 싶다면</h2>
        <p style={{ marginBottom: "14px" }}>
          기본 질문을 확인한 뒤에는 티어표로 육성 우선순위를 잡고, 영웅 도감에서 개별 스킬과 타입을 비교해 보세요.
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link href="/heroes">영웅 도감</Link>과 <Link href="/guides/beginner">초보자 가이드</Link>를 함께 보세요.
        </p>
      </section>
    </div>
  );
}
