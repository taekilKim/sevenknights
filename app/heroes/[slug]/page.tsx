import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getHeroBySlug } from "@/lib/catalog";
import type { Effect, Skill } from "@/lib/types";

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

type SkillTargetType = "enemy-single" | "enemy-multi" | "ally-single" | "ally-multi" | "neutral";
type SkillSectionType = "enhancement" | "awakening-2" | "awakening-6";

type SkillBlock =
  | { type: "target"; text: string; targetType: SkillTargetType }
  | { type: "line"; text: string; isBullet: boolean }
  | { type: "section"; sectionType: SkillSectionType; title: string; icon: string; lines: string[] }
  | { type: "effect"; effect: ParsedEffect };

type ParsedEffect = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  effectType: string | null;
  missing?: boolean;
};

function getSkillTargetType(text: string): SkillTargetType {
  if (/^(모든 적군|전체 적군|적군 \d+명)/.test(text)) {
    return "enemy-multi";
  }

  if (/^(단일 적군|대상 적군|적군 1명|무작위 적군 1명|(?:공격력|방어력|생명력|체력|속공)이 가장 (?:높은|낮은) 적군)/.test(text)) {
    return "enemy-single";
  }

  if (/^(모든 아군|전체 아군|아군 \d+명|(?:공격력|방어력|생명력|체력|속공)이 가장 (?:높은|낮은) 아군 \d+명)/.test(text)) {
    return "ally-multi";
  }

  if (/^(자신|단일 아군|대상 아군|아군 1명|(?:공격력|방어력|생명력|체력|속공)이 가장 (?:높은|낮은) 아군)/.test(text)) {
    return "ally-single";
  }

  return "neutral";
}

function renderInlineSkillText(text: string) {
  const normalized = text.replace(/^-\s*/, "");
  const parts = normalized.split(/(\[[^\]]+\]|(?:물리|마법|모든)?\s*공격력의\s*\d+%|방어력의\s*\d+%|최대 생명력의\s*\d+%|\d+(?:\.\d+)?%|\d+(?:\.\d+)?(?:초|턴|회|명|중첩)|상시|전투당\s*\d+회|피격\s*\d+회)/g);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (/^\[[^\]]+\]$/.test(part)) {
      return (
        <span key={`${part}-${index}`} className="skill-token skill-token-effect">
          {part}
        </span>
      );
    }

    if (/(?:공격력의|방어력의|최대 생명력의|\d+(?:\.\d+)?%|\d+(?:\.\d+)?(?:초|턴|회|명|중첩)|상시|전투당|피격)/.test(part)) {
      return (
        <span key={`${part}-${index}`} className="skill-token skill-token-value">
          {part}
        </span>
      );
    }

    return part;
  });
}

function parseEffectMarker(line: string, effects: Effect[] = []): ParsedEffect | null {
  const match = line.match(/^<<([^,>]+)(?:,\s*([^,>]+))?(?:,\s*([^>]+))?>>$/);

  if (!match) {
    return null;
  }

  const name = match[1].trim();
  let isFulltime = false;
  let variableValue: string | null = null;

  if (match[2]) {
    const second = match[2].trim();
    if (second === "상시") {
      isFulltime = true;
      variableValue = match[3]?.trim() || null;
    } else {
      variableValue = second;
    }
  }

  const candidates = effects.filter((effect) => effect.name === name);
  const effect = candidates.find((candidate) => (isFulltime ? candidate.fulltime === true : !candidate.fulltime)) || candidates[0];

  if (!effect) {
    return {
      id: `missing-${name}`,
      name,
      description: "효과 설명이 아직 연결되지 않았습니다.",
      icon: null,
      effectType: null,
      missing: true,
    };
  }

  const description = effect.hasVariable && variableValue
    ? effect.description.replace(/n/g, variableValue)
    : effect.description;

  return {
    id: effect.id,
    name: effect.name,
    description,
    icon: effect.icon,
    effectType: effect.effectType,
  };
}

function parseSkillDescription(skill: Skill): SkillBlock[] {
  const lines = (skill.description || "")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const blocks: SkillBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("@@") || line === "6초월 효과") {
      const collected: string[] = [];
      index += 1;

      while (index < lines.length && !/^(@@|@|#|<<|!)/.test(lines[index])) {
        collected.push(lines[index]);
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "section", sectionType: "awakening-6", title: "6초월 효과", icon: "/images/trans-6.png", lines: collected });
      continue;
    }

    if (line.startsWith("@") || line === "2초월 효과") {
      const collected: string[] = [];
      index += 1;

      while (index < lines.length && !/^(@@|@|#|<<|!)/.test(lines[index])) {
        collected.push(lines[index]);
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "section", sectionType: "awakening-2", title: "2초월 효과", icon: "/images/trans-2.png", lines: collected });
      continue;
    }

    if (line.startsWith("#") || line === "스킬 강화 효과") {
      const collected: string[] = [];
      index += 1;

      while (index < lines.length && !/^(@@|@|#|<<|!)/.test(lines[index])) {
        collected.push(lines[index]);
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "section", sectionType: "enhancement", title: "스킬 강화 효과", icon: "/images/enhance.png", lines: collected });
      continue;
    }

    if (line.startsWith("<<")) {
      const effect = parseEffectMarker(line, skill.effects);
      if (effect) {
        blocks.push({ type: "effect", effect });
      }
      continue;
    }

    if (line.startsWith("!")) {
      const text = line.replace(/^!/, "");
      blocks.push({ type: "target", text, targetType: getSkillTargetType(text) });
      continue;
    }

    if (/^\[[^\]]+\]$/.test(line)) {
      const text = line.replace(/^\[|\]$/g, "");
      blocks.push({ type: "target", text, targetType: getSkillTargetType(text) });
      continue;
    }

    blocks.push({ type: "line", text: line, isBullet: line.startsWith("-") });
  }

  return blocks;
}

function SkillEffectBox({ effect, inline = false }: { effect: ParsedEffect; inline?: boolean }) {
  return (
    <div
      className={[
        "skill-effect-box",
        "skill-effect-custom",
        effect.effectType ? `skill-effect-${effect.effectType}` : "",
        effect.missing ? "skill-effect-unknown" : "",
        inline ? "inline-effect" : "sidebar-effect",
      ].filter(Boolean).join(" ")}
    >
      <div className="effect-title">
        {effect.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={effect.icon} alt="" className="effect-icon" />
        ) : null}
        <span>{effect.name}</span>
      </div>
      <div className="effect-desc">{renderInlineSkillText(effect.description)}</div>
    </div>
  );
}

function SkillDescription({ skill }: { skill: Skill }) {
  const blocks = parseSkillDescription(skill);
  const effectBlocks = blocks.filter((block): block is Extract<SkillBlock, { type: "effect" }> => block.type === "effect");

  if (blocks.length === 0) {
    return <p className="muted">설명이 없습니다.</p>;
  }

  return (
    <>
      <div className="skill-description">
        {blocks.map((block, index) => {
          if (block.type === "target") {
            return (
              <div key={`${block.text}-${index}`} className={`skill-target-box target-${block.targetType}`}>
                {renderInlineSkillText(block.text)}
              </div>
            );
          }

          if (block.type === "section") {
            return (
              <div key={`${block.sectionType}-${index}`} className={`skill-effect-box ${block.sectionType}`}>
                <div className="effect-title">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.icon} alt="" className="effect-icon-img" />
                  <span>{block.title}</span>
                </div>
                <div className="effect-desc">
                  {block.lines.map((line, lineIndex) => (
                    <p key={`${line}-${lineIndex}`}>{renderInlineSkillText(line)}</p>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === "effect") {
            return <SkillEffectBox key={`${block.effect.id}-${index}`} effect={block.effect} inline />;
          }

          return (
            <p key={`${block.text}-${index}`} className={`skill-description-line${block.isBullet ? " is-bullet" : ""}`}>
              {block.isBullet ? <span aria-hidden="true" className="skill-bullet">•</span> : null}
              <span>{renderInlineSkillText(block.text)}</span>
            </p>
          );
        })}
      </div>
      {effectBlocks.length > 0 ? (
        <div className="skill-effects">
          {effectBlocks.map((block, index) => (
            <SkillEffectBox key={`${block.effect.id}-side-${index}`} effect={block.effect} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function HeroStats({ hero }: { hero: NonNullable<Awaited<ReturnType<typeof getHeroBySlug>>> }) {
  return (
    <div className="profile-stats-grid" aria-label="영웅 기본 스탯">
      {statEntries.map((entry) => (
        <div key={entry.key} className="profile-stat-card">
          <span>{entry.label}</span>
          <strong>{String(hero[entry.key] ?? "-")}</strong>
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

  const skills = hero.skills;

  return (
    <div className="hero-detail-page">
      <Link href="/heroes" className="detail-back-link">
        ← 도감으로 돌아가기
      </Link>
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
              <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}>{hero.name}</h1>
              {hero.nickname ? <p className="muted" style={{ margin: 0 }}>{hero.nickname}</p> : null}
            </div>
            <p className="muted" style={{ margin: 0, fontSize: "1rem" }}>
              {hero.description || "상세 설명은 아직 정리 중입니다. 이후 가이드 문서와 함께 확장할 수 있습니다."}
            </p>
            {hero.transLevel ? <div className="pill">초월 정보: {String(hero.transLevel)}</div> : null}
            <HeroStats hero={hero} />
          </div>
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
                <div className="skill-card-header">
                  {skill.image ? (
                    <span className="skill-image-frame">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={skill.image} alt={`${skill.name} 아이콘`} />
                    </span>
                  ) : null}
                  <div>
                    <div className="badge-row">
                      <span className="pill">{skill.type || "스킬"}</span>
                      {skill.cooltime ? <span className="pill">쿨타임 {String(skill.cooltime)}</span> : null}
                    </div>
                    <h3>{skill.name}</h3>
                  </div>
                </div>
                <SkillDescription skill={skill} />
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
