import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getHeroBySlug } from "@/lib/catalog";
import type { Skill } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
};

const statEntries = [
  { key: "atk", label: "공격력" },
  { key: "def", label: "방어력" },
  { key: "hp", label: "생명력" },
  { key: "spd", label: "속공" },
  { key: "crit_rate", label: "치명타 확률" },
  { key: "crit_dmg", label: "치명타 피해" },
  { key: "weak_rate", label: "약점 공격 확률" },
  { key: "block_rate", label: "막기 확률" },
  { key: "dmg_reduce", label: "받는 피해 감소" },
  { key: "eff_hit", label: "효과 적중" },
  { key: "eff_res", label: "효과 저항" },
] as const;

function formatSkillDescription(description: string | null | undefined) {
  if (!description) {
    return [];
  }

  return description
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("<<") && line.endsWith(">>")) {
        return { type: "effect", text: line.replace(/^<<|>>$/g, "") };
      }

      if (line.startsWith("@@")) {
        return { type: "transcend transcend-6", text: line.replace(/^@@/, "") };
      }

      if (line.startsWith("@")) {
        return { type: "transcend transcend-2", text: line.replace(/^@/, "") };
      }

      if (line.startsWith("#")) {
        return { type: "heading", text: line.replace(/^#/, "") };
      }

      if (line.startsWith("!")) {
        return { type: "target", text: line.replace(/^!/, "") };
      }

      if (/^\[[^\]]+\]$/.test(line)) {
        return { type: "target", text: line.replace(/^\[|\]$/g, "") };
      }

      if (line.startsWith("-")) {
        return { type: "bullet", text: line.replace(/^-\s*/, "") };
      }

      if (/^(스킬 강화 효과|2초월 효과|6초월 효과)$/.test(line)) {
        return { type: "heading", text: line };
      }

      return { type: "body", text: line };
    });
}

function SkillDescription({ skill }: { skill: Skill }) {
  const lines = formatSkillDescription(skill.description);

  if (lines.length === 0) {
    return <p className="muted">설명이 없습니다.</p>;
  }

  return (
    <div className="skill-description">
      {lines.map((line, index) => (
        <div key={`${line.text}-${index}`} className={`skill-line skill-line-${line.type}`}>
          {line.type === "bullet" ? <span aria-hidden="true">•</span> : null}
          <span>{line.text}</span>
        </div>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    return {
      title: "영웅을 찾을 수 없습니다",
    };
  }

  return {
    title: `${hero.name} 상세`,
    description: hero.description || `${hero.name}의 스탯, 스킬, 히스토리를 확인하세요.`,
  };
}

export default async function HeroDetailPage({ params }: Props) {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    notFound();
  }

  const skills = [hero.attack, hero.active_1, hero.active_2, hero.passive].filter(Boolean) as Skill[];

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section className="hero-panel">
        <div className="detail-header">
          <div className="portrait-frame">
            {hero.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.portrait} alt={hero.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>
          <div style={{ display: "grid", gap: "18px", alignContent: "start" }}>
            <div className="badge-row">
              <span className="pill">{hero.rarity || "미분류"}</span>
              {hero.type ? <span className="pill">{hero.type}</span> : null}
              {hero.group ? <span className="pill">{hero.group}</span> : null}
            </div>
            <div>
              <Link href="/heroes" className="muted">
                ← 영웅 도감으로
              </Link>
              <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}>{hero.name}</h1>
              {hero.nickname ? <p className="muted" style={{ margin: 0 }}>{hero.nickname}</p> : null}
            </div>
            <p className="muted" style={{ margin: 0, fontSize: "1rem" }}>
              {hero.description || "상세 설명은 아직 정리 중입니다. 이후 가이드 문서와 함께 확장할 수 있습니다."}
            </p>
            {hero.transLevel ? <div className="pill">초월 정보: {String(hero.transLevel)}</div> : null}
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>기본 스탯</h2>
        </div>
        <div className="stats-grid">
          {statEntries.map((entry) => (
            <div key={entry.key} className="stat-card">
              <div className="muted" style={{ marginBottom: "8px" }}>
                {entry.label}
              </div>
              <strong style={{ fontSize: "1.25rem" }}>{String(hero[entry.key] ?? "-")}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>스킬</h2>
          <span className="muted">{skills.length}개 스킬</span>
        </div>
        {skills.length > 0 ? (
          <div className="skills-grid">
            {skills.map((skill) => (
              <article key={`${skill.type}-${skill.name}`} className="skill-card">
                <div className="badge-row" style={{ marginBottom: "12px" }}>
                  <span className="pill">{skill.type || "스킬"}</span>
                  {skill.cooltime ? <span className="pill">쿨타임 {String(skill.cooltime)}</span> : null}
                </div>
                <h3 style={{ marginTop: 0 }}>{skill.name}</h3>
                <SkillDescription skill={skill} />
                {skill.effects && skill.effects.length > 0 ? (
                  <div className="skill-effects">
                    {skill.effects.map((effect) => (
                      <span key={effect.id} className="pill">
                        {effect.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">스킬 데이터가 아직 연결되지 않았습니다.</div>
        )}
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h2>업데이트 히스토리</h2>
        </div>
        {hero.history.length > 0 ? (
          <div className="history-list">
            {hero.history.map((entry, index) => (
              <article key={`${entry.date}-${index}`} className="history-item">
                <strong>{entry.date}</strong>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {entry.content}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">기록된 업데이트 히스토리가 없습니다.</div>
        )}
      </section>

    </div>
  );
}
