"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import type { Effect, HeroSummary } from "@/lib/types";

type FormationId = "default" | "balance" | "attack" | "defense";
type Line = "front" | "back";
type SlotHero = HeroSummary & { transcendence: 0 | 2 | 6 };
type Slots = Record<Line, Array<SlotHero | null>>;

type Props = {
  heroes: HeroSummary[];
};

const formations: Record<FormationId, { name: string; front: number; back: number; description: string }> = {
  default: { name: "기본", front: 2, back: 3, description: "앞줄 2명, 뒷줄 3명으로 가장 무난한 배치" },
  balance: { name: "밸런스", front: 3, back: 2, description: "앞줄을 보강해 안정성을 높이는 배치" },
  attack: { name: "공격", front: 1, back: 4, description: "딜러 보호와 화력 집중에 유리한 배치" },
  defense: { name: "보호", front: 4, back: 1, description: "전열 압박과 생존 중심 배치" },
};

const emptySlots = (formation: FormationId): Slots => ({
  front: Array.from({ length: formations[formation].front }, () => null),
  back: Array.from({ length: formations[formation].back }, () => null),
});

const rarityOrder: Record<string, number> = {
  "전설+": 0,
  전설: 1,
  희귀: 2,
};

function selectedList(slots: Slots) {
  return [...slots.front, ...slots.back].filter((hero): hero is SlotHero => Boolean(hero));
}

function effectDescription(effect: Effect, skillDescription: string) {
  if (!effect.hasVariable) return effect.description;

  const tokenPattern = /<<([^>\n]+)>>/g;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(skillDescription)) !== null) {
    const [name, , value] = match[1].split(",").map((part) => part.trim());
    if (name === effect.name && value) {
      return effect.description.replace(/\bn\b/g, value);
    }
  }

  return effect.description;
}

function passiveEffects(hero: SlotHero) {
  return hero.skills
    .filter((skill) => skill.type === "패시브" || skill.type === "Passive" || skill.name.includes("패시브"))
    .flatMap((skill) =>
      (skill.effects || []).map((effect) => ({
        hero,
        skill,
        effect,
        description: effectDescription(effect, skill.description || ""),
      })),
    );
}

function nextTranscendence(value: 0 | 2 | 6): 0 | 2 | 6 {
  if (value === 0) return 2;
  if (value === 2) return 6;
  return 0;
}

export function DeckBuilder({ heroes }: Props) {
  const [formation, setFormation] = useState<FormationId>("default");
  const [slots, setSlots] = useState<Slots>(() => emptySlots("default"));
  const [activeSlot, setActiveSlot] = useState<{ line: Line; index: number } | null>(null);
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState("전체");
  const [type, setType] = useState("전체");
  const [effectTab, setEffectTab] = useState<"ally" | "enemy">("ally");
  const deferredSearch = useDeferredValue(search);
  const selectedHeroes = selectedList(slots);

  const rarityOptions = useMemo(() => ["전체", ...Array.from(new Set(heroes.map((hero) => hero.rarity).filter(Boolean)))], [heroes]);
  const typeOptions = useMemo(() => ["전체", ...Array.from(new Set(heroes.map((hero) => hero.type).filter(Boolean)))], [heroes]);

  const filteredHeroes = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    const selectedIds = new Set(selectedHeroes.map((hero) => hero.id));

    return heroes
      .filter((hero) => {
        const matchesKeyword = !keyword || hero.name.toLowerCase().includes(keyword) || (hero.nickname || "").toLowerCase().includes(keyword);
        const matchesRarity = rarity === "전체" || hero.rarity === rarity;
        const matchesType = type === "전체" || hero.type === type;
        return matchesKeyword && matchesRarity && matchesType;
      })
      .sort((left, right) => {
        if (selectedIds.has(left.id) !== selectedIds.has(right.id)) return selectedIds.has(left.id) ? -1 : 1;
        return (rarityOrder[left.rarity] ?? 9) - (rarityOrder[right.rarity] ?? 9) || left.name.localeCompare(right.name, "ko");
      });
  }, [deferredSearch, heroes, rarity, selectedHeroes, type]);

  const groupedEffects = useMemo(() => {
    const ally: ReturnType<typeof passiveEffects> = [];
    const enemy: ReturnType<typeof passiveEffects> = [];

    selectedHeroes.forEach((hero) => {
      passiveEffects(hero).forEach((entry) => {
        if (entry.effect.effectType === "buff" || entry.effect.effectType === "mixed") ally.push(entry);
        if (entry.effect.effectType === "debuff" || entry.effect.effectType === "mixed") enemy.push(entry);
      });
    });

    return { ally, enemy };
  }, [selectedHeroes]);

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedHeroes.forEach((hero) => counts.set(hero.type || "미분류", (counts.get(hero.type || "미분류") || 0) + 1));
    return Array.from(counts.entries());
  }, [selectedHeroes]);

  const changeFormation = (nextFormation: FormationId) => {
    const currentHeroes = selectedList(slots);
    const nextSlots = emptySlots(nextFormation);
    currentHeroes.forEach((hero, index) => {
      if (index < nextSlots.front.length) {
        nextSlots.front[index] = hero;
      } else if (index - nextSlots.front.length < nextSlots.back.length) {
        nextSlots.back[index - nextSlots.front.length] = hero;
      }
    });
    setFormation(nextFormation);
    setSlots(nextSlots);
  };

  const placeHero = (hero: HeroSummary) => {
    const target = activeSlot || firstEmptySlot();
    if (!target) return;

    setSlots((current) => {
      const nextSlots: Slots = {
        front: current.front.map((entry) => (entry?.id === hero.id ? null : entry)),
        back: current.back.map((entry) => (entry?.id === hero.id ? null : entry)),
      };
      nextSlots[target.line][target.index] = { ...hero, transcendence: 0 };
      return nextSlots;
    });
    setActiveSlot(null);
  };

  const firstEmptySlot = () => {
    const frontIndex = slots.front.findIndex((entry) => !entry);
    if (frontIndex >= 0) return { line: "front" as const, index: frontIndex };
    const backIndex = slots.back.findIndex((entry) => !entry);
    if (backIndex >= 0) return { line: "back" as const, index: backIndex };
    return null;
  };

  const removeHero = (line: Line, index: number) => {
    setSlots((current) => ({
      ...current,
      [line]: current[line].map((hero, heroIndex) => (heroIndex === index ? null : hero)),
    }));
  };

  const cycleHeroTranscendence = (line: Line, index: number) => {
    setSlots((current) => ({
      ...current,
      [line]: current[line].map((hero, heroIndex) =>
        hero && heroIndex === index ? { ...hero, transcendence: nextTranscendence(hero.transcendence) } : hero,
      ),
    }));
  };

  const clearDeck = () => {
    setSlots(emptySlots(formation));
    setActiveSlot(null);
  };

  const copyDeckText = async () => {
    const text = [
      `세나DB 덱 빌더 - ${formations[formation].name} 진형`,
      `앞줄: ${slots.front.map((hero) => hero?.name || "-").join(" / ")}`,
      `뒷줄: ${slots.back.map((hero) => hero?.name || "-").join(" / ")}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="deck-builder-page">
      <section className="deck-hero-panel">
        <div>
          <h1>결투장 덱 빌더</h1>
        </div>
      </section>

      <section className="deck-builder-layout">
        <div className="deck-board-panel">
          <div className="deck-formation-tabs" aria-label="진형 선택">
            {(Object.entries(formations) as Array<[FormationId, typeof formations[FormationId]]>).map(([id, item]) => (
              <button key={id} type="button" data-active={formation === id} onClick={() => changeFormation(id)}>
                <strong>{item.name}</strong>
                <span>{item.front}-{item.back}</span>
              </button>
            ))}
          </div>

          <div className="deck-arena-card">
            <div className="deck-line deck-back-line">
              <div className="deck-line-label">뒷줄</div>
              <div className="deck-slot-row">
                {slots.back.map((hero, index) => (
                  <DeckSlot
                    key={`back-${index}`}
                    hero={hero}
                    line="back"
                    index={index}
                    active={activeSlot?.line === "back" && activeSlot.index === index}
                    onPick={() => setActiveSlot({ line: "back", index })}
                    onRemove={() => removeHero("back", index)}
                    onCycle={() => cycleHeroTranscendence("back", index)}
                  />
                ))}
              </div>
            </div>

            <div className="deck-line deck-front-line">
              <div className="deck-line-label">앞줄</div>
              <div className="deck-slot-row">
                {slots.front.map((hero, index) => (
                  <DeckSlot
                    key={`front-${index}`}
                    hero={hero}
                    line="front"
                    index={index}
                    active={activeSlot?.line === "front" && activeSlot.index === index}
                    onPick={() => setActiveSlot({ line: "front", index })}
                    onRemove={() => removeHero("front", index)}
                    onCycle={() => cycleHeroTranscendence("front", index)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="deck-actions-panel">
            <button type="button" onClick={clearDeck}>덱 초기화</button>
            <button type="button" onClick={copyDeckText}>텍스트 복사</button>
            <Link href="/guides/arena-decks">결투장 덱 공략 보기</Link>
          </div>
        </div>

        <aside className="deck-insight-panel">
          <div>
            <h2>덱 체크</h2>
            <p>{formations[formation].description}</p>
          </div>

          <div className="deck-role-grid">
            {roleCounts.length > 0 ? roleCounts.map(([role, count]) => (
              <span key={role}>
                <strong>{role}</strong>
                {count}명
              </span>
            )) : <p className="muted">영웅을 선택하면 타입 균형이 표시됩니다.</p>}
          </div>

          <div className="deck-effect-tabs">
            <button type="button" data-active={effectTab === "ally"} onClick={() => setEffectTab("ally")}>아군 강화</button>
            <button type="button" data-active={effectTab === "enemy"} onClick={() => setEffectTab("enemy")}>적군 약화</button>
          </div>

          <div className="deck-effect-list">
            {(effectTab === "ally" ? groupedEffects.ally : groupedEffects.enemy).length > 0 ? (
              (effectTab === "ally" ? groupedEffects.ally : groupedEffects.enemy).map((entry, index) => (
                <article key={`${entry.hero.id}-${entry.effect.id}-${index}`} className="deck-effect-item">
                  {entry.effect.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.effect.icon} alt={entry.effect.name} />
                  ) : null}
                  <div>
                    <strong>{entry.effect.name}</strong>
                    <span>{entry.hero.name} · {entry.skill.name}</span>
                    <p>{entry.description}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">표시할 패시브 효과가 없습니다.</div>
            )}
          </div>
        </aside>
      </section>

      <section className="deck-picker-panel">
        <div className="catalog-toolbar">
          <label>
            <span>영웅 검색</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="델론즈, 루디, 카린..." />
          </label>
          <label>
            <span>등급</span>
            <select value={rarity} onChange={(event) => setRarity(event.target.value)}>
              {rarityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>타입</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="deck-hero-picker-grid">
          {filteredHeroes.map((hero) => {
            const selected = selectedHeroes.some((entry) => entry.id === hero.id);

            return (
              <button key={hero.id} type="button" className="deck-hero-pick" data-selected={selected} onClick={() => placeHero(hero)}>
                <span className="deck-pick-portrait">
                  {hero.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.portrait} alt={hero.name} />
                  ) : null}
                </span>
                <span>
                  <strong>{hero.name}</strong>
                  <small>{hero.rarity} · {hero.type}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DeckSlot({
  hero,
  line,
  index,
  active,
  onPick,
  onRemove,
  onCycle,
}: {
  hero: SlotHero | null;
  line: Line;
  index: number;
  active: boolean;
  onPick: () => void;
  onRemove: () => void;
  onCycle: () => void;
}) {
  return (
    <button type="button" className="deck-slot-card" data-active={active} data-filled={Boolean(hero)} onClick={hero ? onRemove : onPick}>
      <span className="deck-slot-position">{line === "front" ? "F" : "B"}{index + 1}</span>
      {hero ? (
        <>
          <span className="deck-slot-portrait">
            {hero.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.portrait} alt={hero.name} />
            ) : null}
          </span>
          <strong>{hero.name}</strong>
          <span className="deck-slot-meta">{hero.type}</span>
          <span
            className="deck-transcendence"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onCycle();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onCycle();
              }
            }}
          >
            {hero.transcendence ? `★${hero.transcendence}` : "★0"}
          </span>
        </>
      ) : (
        <span className="deck-slot-empty">+</span>
      )}
    </button>
  );
}
