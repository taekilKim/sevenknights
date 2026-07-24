"use client";

import { useState } from "react";

import type { Effect, HeroDetail, Skill } from "@/lib/types";

type AdminHero = Omit<HeroDetail, "skills">;
type SkillType = "기본공격" | "패시브" | "액티브" | "각성";

type Props = {
  heroes: AdminHero[];
  effects: Effect[];
};

const basicFields = [
  { key: "name", label: "이름" },
  { key: "nickname", label: "별명" },
  { key: "group", label: "소속" },
  { key: "rarity", label: "등급" },
  { key: "type", label: "타입" },
] as const;

const statFields = [
  { key: "atk", label: "공격력" },
  { key: "def", label: "방어력" },
  { key: "hp", label: "생명력" },
  { key: "spd", label: "속공" },
  { key: "crit_rate", label: "치명타 확률" },
  { key: "crit_dmg", label: "치명타 피해" },
  { key: "weak_rate", label: "약점 공격" },
  { key: "block_rate", label: "막기 확률" },
  { key: "dmg_reduce", label: "피해 감소" },
  { key: "eff_hit", label: "효과 적중" },
  { key: "eff_res", label: "효과 저항" },
] as const;

const skillTypes: SkillType[] = ["기본공격", "패시브", "액티브", "각성"];

function normalizeSkillType(type: string | undefined): SkillType {
  if (type === "Attack") return "기본공격";
  if (type === "Passive") return "패시브";
  if (type === "Awakening") return "각성";
  if (type === "Active") return "액티브";
  return skillTypes.includes(type as SkillType) ? (type as SkillType) : "액티브";
}

function heroSkills(hero: AdminHero | undefined): Skill[] {
  if (!hero) return [];
  if (Array.isArray(hero.skillList) && hero.skillList.length > 0) {
    return hero.skillList.map((skill, index) => ({
      ...skill,
      id: skill.id || `skill-${hero.id}-${index + 1}`,
      type: normalizeSkillType(skill.type),
    }));
  }

  return [hero.attack, hero.passive, hero.active_1, hero.active_2]
    .filter((skill): skill is Skill => Boolean(skill))
    .map((skill, index) => ({
      ...skill,
      id: skill.id || `skill-${hero.id}-${index + 1}`,
      type: normalizeSkillType(skill.type),
    }));
}

function cloneHero(hero: AdminHero | undefined): AdminHero {
  const nextHero = JSON.parse(JSON.stringify(hero || {})) as AdminHero;
  nextHero.skillList = heroSkills(nextHero);
  return nextHero;
}

function syncLegacySkillFields(hero: AdminHero): AdminHero {
  const skills = hero.skillList || [];
  const attack = skills.find((skill) => skill.type === "기본공격") || null;
  const passive = skills.find((skill) => skill.type === "패시브") || null;
  const activeSkills = skills.filter((skill) => skill.type === "액티브");

  return {
    ...hero,
    attack,
    passive,
    active_1: activeSkills[0] || null,
    active_2: activeSkills[1] || null,
  };
}

function createEmptySkill(heroId: string, index: number): Skill {
  return {
    id: `skill-${heroId}-${Date.now()}-${index}`,
    type: "액티브",
    name: "",
    description: "",
    image: null,
    cooltime: null,
    effects: [],
  };
}

function effectToken(effect: Effect) {
  return effect.hasVariable ? `<<${effect.name}, 상시, >>` : `<<${effect.name}>>`;
}

function isValidImagePath(value: string | null | undefined) {
  if (!value) return true;
  return value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/content/") || value.startsWith("/images/");
}

export function AdminHeroEditor({ heroes, effects }: Props) {
  const [selectedId, setSelectedId] = useState(heroes[0]?.id || "");
  const selectedHero = heroes.find((hero) => hero.id === selectedId) || heroes[0];
  const [token, setToken] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [draft, setDraft] = useState<AdminHero>(() => cloneHero(selectedHero));
  const [effectDrafts, setEffectDrafts] = useState<Effect[]>(() => JSON.parse(JSON.stringify(effects)) as Effect[]);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);
  const [effectMenuSkillId, setEffectMenuSkillId] = useState<string | null>(null);
  const [status, setStatus] = useState("저장할 영웅을 선택하세요.");
  const [authStatus, setAuthStatus] = useState("어드민 토큰을 입력하면 편집 화면이 열립니다.");

  const selectHero = (id: string) => {
    const hero = heroes.find((entry) => entry.id === id);
    setSelectedId(id);
    setDraft(cloneHero(hero));
    setEffectMenuSkillId(null);
    setStatus(`${hero?.name || "영웅"} 데이터를 편집 중입니다.`);
  };

  const updateField = (key: keyof AdminHero, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value || null,
    }));
  };

  const updateSkill = (skillId: string, patch: Partial<Skill>) => {
    setDraft((current) => ({
      ...current,
      skillList: (current.skillList || []).map((skill) => (skill.id === skillId ? { ...skill, ...patch } : skill)),
    }));
  };

  const addSkill = () => {
    setDraft((current) => ({
      ...current,
      skillList: [...(current.skillList || []), createEmptySkill(current.id, (current.skillList || []).length + 1)],
    }));
    setStatus("새 스킬을 추가했습니다.");
  };

  const deleteSkill = (skillId: string) => {
    setDraft((current) => ({
      ...current,
      skillList: (current.skillList || []).filter((skill) => skill.id !== skillId),
    }));
    setStatus("스킬을 삭제했습니다. 저장해야 실제 반영됩니다.");
  };

  const moveSkill = (targetSkillId: string) => {
    if (!draggedSkillId || draggedSkillId === targetSkillId) return;

    setDraft((current) => {
      const skills = [...(current.skillList || [])];
      const fromIndex = skills.findIndex((skill) => skill.id === draggedSkillId);
      const toIndex = skills.findIndex((skill) => skill.id === targetSkillId);
      if (fromIndex < 0 || toIndex < 0) return current;

      const [movedSkill] = skills.splice(fromIndex, 1);
      skills.splice(toIndex, 0, movedSkill);
      return { ...current, skillList: skills };
    });
  };

  const insertEffectToken = (skillId: string, effect: Effect) => {
    const skill = draft.skillList?.find((entry) => entry.id === skillId);
    const description = skill?.description || "";
    const openIndex = description.lastIndexOf("<<");
    const token = effectToken(effect);
    const nextDescription = openIndex >= 0 && !description.slice(openIndex).includes(">>")
      ? `${description.slice(0, openIndex)}${token}`
      : `${description}${description.endsWith("\n") || !description ? "" : "\n"}${token}`;

    updateSkill(skillId, {
      description: nextDescription,
      effects: [...(skill?.effects || []).filter((entry) => entry.id !== effect.id), effect],
    });
    setEffectMenuSkillId(null);
  };

  const unlockAdmin = async () => {
    setAuthStatus("토큰을 확인 중입니다...");

    if (!token.trim()) {
      setAuthStatus("어드민 토큰을 입력해 주세요.");
      return;
    }

    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setAuthStatus(payload?.error || "토큰이 일치하지 않습니다.");
      return;
    }

    setIsUnlocked(true);
    setStatus("저장할 영웅을 선택하세요.");
  };

  const saveHero = async () => {
    setStatus("저장 중입니다...");

    if (!draft.id) {
      setStatus("영웅 id는 반드시 필요합니다.");
      return;
    }

    const nextDraft = syncLegacySkillFields(draft);
    const response = await fetch(`/api/admin/heroes/${encodeURIComponent(draft.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(nextDraft),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.error || "저장에 실패했습니다.");
      return;
    }

    setDraft(cloneHero(payload?.hero || nextDraft));
    setStatus(`${payload?.hero?.name || draft.name} 저장 완료. 배포 반영은 커밋/푸시가 필요합니다.`);
  };

  const uploadImage = async (file: File, folder: "heroes" | "skills" | "types" | "effects") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/admin/assets", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error || "이미지 업로드에 실패했습니다.");
    }

    return String(payload.url);
  };

  if (!isUnlocked) {
    return (
      <section className="admin-login-card">
        <div>
          <p className="catalog-eyebrow">Protected</p>
          <h2>어드민 토큰 입력</h2>
          <p className="muted">Vercel 환경변수에 저장한 ADMIN_TOKEN 값을 입력하면 영웅 데이터 편집 화면이 열립니다.</p>
        </div>

        <label htmlFor="admin-token">어드민 토큰</label>
        <input
          id="admin-token"
          type="password"
          placeholder="ADMIN_TOKEN"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void unlockAdmin();
            }
          }}
        />
        <p>{authStatus}</p>
        <button type="button" onClick={unlockAdmin}>
          어드민 열기
        </button>
      </section>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <label htmlFor="hero-select">영웅 선택</label>
        <select id="hero-select" value={selectedId} onChange={(event) => selectHero(event.target.value)}>
          {heroes.map((hero) => (
            <option key={hero.id} value={hero.id}>
              {hero.name}
            </option>
          ))}
        </select>

        <p>{status}</p>
        <button type="button" onClick={saveHero}>
          변경사항 저장
        </button>
      </aside>

      <section className="admin-editor-card">
        <div>
          <span>Hero Editor</span>
          <strong>{selectedHero?.name || "영웅 데이터"}</strong>
        </div>

        <div className="admin-form-section">
          <h2>기본 정보</h2>
          <div className="admin-form-grid">
            {basicFields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  value={String(draft[field.key] ?? "")}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="admin-form-grid">
            <ImageUrlField
              label="프로필 이미지"
              value={draft.portrait || ""}
              onChange={(value) => updateField("portrait", value)}
              folder="heroes"
              onUpload={uploadImage}
              onStatus={setStatus}
            />
            <ImageUrlField
              label="타입 아이콘"
              value={draft.typeImage || ""}
              onChange={(value) => updateField("typeImage", value)}
              folder="types"
              onUpload={uploadImage}
              onStatus={setStatus}
            />
          </div>
          <label>
            <span>설명</span>
            <textarea
              className="admin-compact-textarea"
              value={draft.description || ""}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
        </div>

        <div className="admin-form-section">
          <h2>스탯</h2>
          <div className="admin-form-grid admin-stat-grid">
            {statFields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  value={String(draft[field.key] ?? "")}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="admin-form-section">
          <div className="admin-section-title">
            <div>
              <h2>스킬</h2>
              <p>카드를 드래그해서 순서를 바꾸면 도감 상세 화면에도 같은 순서로 표시됩니다.</p>
            </div>
            <button type="button" onClick={addSkill}>스킬 추가</button>
          </div>

          <div className="admin-help-card">
            <strong>스킬 설명 작성법</strong>
            <p><code>!대상</code>은 대상 박스, <code>- 내용</code>은 일반 설명, <code>#스킬 강화 효과</code>는 강화 박스, <code>@2초월 효과</code>처럼 쓰면 초월 박스로 표시됩니다.</p>
            <p>효과는 <code>&lt;&lt;침묵&gt;&gt;</code>처럼 작성합니다. 수치가 필요한 효과는 <code>&lt;&lt;물리 피해량 증가, 상시, 17&gt;&gt;</code>처럼 값까지 넣어주세요.</p>
          </div>

          <div className="admin-skill-stack">
            {(draft.skillList || []).map((skill, index) => (
              <article
                key={skill.id}
                className="admin-skill-card"
                draggable
                onDragStart={() => setDraggedSkillId(skill.id || null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveSkill(skill.id || "")}
                onDragEnd={() => setDraggedSkillId(null)}
              >
                <div className="admin-skill-card-top">
                  <div>
                    <span className="admin-drag-handle">드래그</span>
                    <h3>{index + 1}. {skill.name || "새 스킬"}</h3>
                  </div>
                  <button type="button" onClick={() => deleteSkill(skill.id || "")}>삭제</button>
                </div>

                <div className="admin-form-grid">
                  <label>
                    <span>스킬명</span>
                    <input
                      value={skill.name || ""}
                      onChange={(event) => updateSkill(skill.id || "", { name: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>유형</span>
                    <select
                      value={normalizeSkillType(skill.type)}
                      onChange={(event) => updateSkill(skill.id || "", { type: event.target.value })}
                    >
                      {skillTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>쿨타임</span>
                    <input
                      value={String(skill.cooltime ?? "")}
                      onChange={(event) => updateSkill(skill.id || "", { cooltime: event.target.value || null })}
                    />
                  </label>
                  <ImageUrlField
                    label="스킬 이미지"
                    value={skill.image || ""}
                    onChange={(value) => updateSkill(skill.id || "", { image: value || null })}
                    folder="skills"
                    onUpload={uploadImage}
                    onStatus={setStatus}
                  />
                </div>

                <label>
                  <span>스킬 설명</span>
                  <textarea
                    className="admin-compact-textarea"
                    value={skill.description || ""}
                    onChange={(event) => {
                      updateSkill(skill.id || "", { description: event.target.value });
                      setEffectMenuSkillId(event.target.value.endsWith("<<") ? skill.id || null : effectMenuSkillId);
                    }}
                    onFocus={() => setEffectMenuSkillId(skill.id || null)}
                  />
                </label>

                {effectMenuSkillId === skill.id ? (
                  <div className="admin-effect-picker">
                    <div>
                      <strong>효과 목록</strong>
                      <button type="button" onClick={() => setEffectMenuSkillId(null)}>닫기</button>
                    </div>
                    <div className="admin-effect-list">
                      {effectDrafts.map((effect) => (
                        <button key={effect.id} type="button" onClick={() => insertEffectToken(skill.id || "", effect)}>
                          <span>{effect.name}</span>
                          <small>{effect.hasVariable ? "수치 필요" : effect.effectType || "효과"}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <EffectAdminPanel
          effects={effectDrafts}
          token={token}
          onChange={setEffectDrafts}
          onUpload={uploadImage}
          onStatus={setStatus}
        />
      </section>
    </div>
  );
}

function ImageUrlField({
  label,
  value,
  folder,
  onChange,
  onUpload,
  onStatus,
}: {
  label: string;
  value: string;
  folder: "heroes" | "skills" | "types" | "effects";
  onChange: (value: string) => void;
  onUpload: (file: File, folder: "heroes" | "skills" | "types" | "effects") => Promise<string>;
  onStatus: (status: string) => void;
}) {
  const valid = isValidImagePath(value);

  return (
    <label className="admin-image-field">
      <span>{label}</span>
      <div className="admin-image-input-row">
        <input
          value={value}
          placeholder="https://cdn... 또는 /content/..."
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <a href={value} target="_blank" rel="noreferrer">
            열기
          </a>
        ) : null}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          try {
            onStatus(`${label} 업로드 중입니다...`);
            const url = await onUpload(file, folder);
            onChange(url);
            onStatus(`${label} 업로드 완료. 저장 버튼을 눌러 데이터에 반영하세요.`);
          } catch (error) {
            onStatus(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
          } finally {
            event.target.value = "";
          }
        }}
      />
      <div className="admin-image-preview" data-empty={!value} data-invalid={!valid}>
        {value && valid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`${label} 미리보기`} />
        ) : (
          <span>{value ? "이미지 경로를 확인해 주세요." : "이미지 미리보기"}</span>
        )}
      </div>
      <small>CDN URL 또는 사이트 내부 경로를 붙여넣으세요. 예: /content/heroes/hero-005.png</small>
    </label>
  );
}

function emptyEffect(index: number): Effect {
  return {
    id: `effect-${Date.now()}-${index}`,
    name: "",
    description: "",
    effectType: "buff",
    hasVariable: false,
    fulltime: false,
    icon: null,
  };
}

function EffectAdminPanel({
  effects,
  token,
  onChange,
  onUpload,
  onStatus,
}: {
  effects: Effect[];
  token: string;
  onChange: (effects: Effect[]) => void;
  onUpload: (file: File, folder: "heroes" | "skills" | "types" | "effects") => Promise<string>;
  onStatus: (status: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(effects[0]?.id || "");
  const [query, setQuery] = useState("");
  const selectedEffect = effects.find((effect) => effect.id === selectedId) || effects[0];
  const filteredEffects = effects.filter((effect) => effect.name.includes(query) || effect.id.includes(query));

  const updateEffect = (patch: Partial<Effect>) => {
    if (!selectedEffect) return;
    onChange(effects.map((effect) => (effect.id === selectedEffect.id ? { ...effect, ...patch } : effect)));
  };

  const saveEffect = async () => {
    if (!selectedEffect?.id || !selectedEffect.name) {
      onStatus("효과 id와 이름을 입력해 주세요.");
      return;
    }

    const response = await fetch(`/api/admin/effects/${encodeURIComponent(selectedEffect.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(selectedEffect),
    });

    if (!response.ok && response.status === 404) {
      const createResponse = await fetch("/api/admin/effects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(selectedEffect),
      });
      const createPayload = await createResponse.json().catch(() => null);
      onStatus(createResponse.ok ? `${selectedEffect.name} 효과를 추가했습니다.` : createPayload?.error || "효과 추가에 실패했습니다.");
      return;
    }

    const payload = await response.json().catch(() => null);
    onStatus(response.ok ? `${selectedEffect.name} 효과를 저장했습니다.` : payload?.error || "효과 저장에 실패했습니다.");
  };

  const addEffect = () => {
    const nextEffect = emptyEffect(effects.length + 1);
    onChange([nextEffect, ...effects]);
    setSelectedId(nextEffect.id);
    onStatus("새 효과를 추가했습니다. 내용을 입력한 뒤 저장하세요.");
  };

  const deleteEffect = async () => {
    if (!selectedEffect) return;
    const response = await fetch(`/api/admin/effects/${encodeURIComponent(selectedEffect.id)}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok && response.status !== 404) {
      onStatus(payload?.error || "효과 삭제에 실패했습니다.");
      return;
    }

    const nextEffects = effects.filter((effect) => effect.id !== selectedEffect.id);
    onChange(nextEffects);
    setSelectedId(nextEffects[0]?.id || "");
    onStatus(`${selectedEffect.name || selectedEffect.id} 효과를 삭제했습니다.`);
  };

  return (
    <div className="admin-form-section">
      <div className="admin-section-title">
        <div>
          <h2>스킬 효과 관리</h2>
          <p>스킬 설명에서 <code>&lt;&lt;효과명&gt;&gt;</code>으로 연결되는 효과 사전을 관리합니다.</p>
        </div>
        <button type="button" onClick={addEffect}>효과 추가</button>
      </div>

      <div className="admin-effect-admin">
        <aside>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="효과 검색" />
          <div className="admin-effect-admin-list">
            {filteredEffects.map((effect) => (
              <button key={effect.id} type="button" data-active={effect.id === selectedEffect?.id} onClick={() => setSelectedId(effect.id)}>
                {effect.name || effect.id}
              </button>
            ))}
          </div>
        </aside>

        {selectedEffect ? (
          <div className="admin-effect-editor">
            <div className="admin-form-grid">
              <label>
                <span>ID</span>
                <input value={selectedEffect.id} readOnly />
              </label>
              <label>
                <span>효과명</span>
                <input value={selectedEffect.name} onChange={(event) => updateEffect({ name: event.target.value })} />
              </label>
              <label>
                <span>효과 타입</span>
                <select value={selectedEffect.effectType || "neutral"} onChange={(event) => updateEffect({ effectType: event.target.value })}>
                  <option value="buff">buff</option>
                  <option value="debuff">debuff</option>
                  <option value="mixed">mixed</option>
                  <option value="neutral">neutral</option>
                </select>
              </label>
              <label>
                <span>수치 변수 사용</span>
                <select value={selectedEffect.hasVariable ? "true" : "false"} onChange={(event) => updateEffect({ hasVariable: event.target.value === "true" })}>
                  <option value="false">아니오</option>
                  <option value="true">예</option>
                </select>
              </label>
            </div>
            <ImageUrlField
              label="효과 아이콘"
              value={selectedEffect.icon || ""}
              folder="effects"
              onChange={(value) => updateEffect({ icon: value || null })}
              onUpload={onUpload}
              onStatus={onStatus}
            />
            <label>
              <span>효과 설명</span>
              <textarea
                className="admin-compact-textarea"
                value={selectedEffect.description}
                onChange={(event) => updateEffect({ description: event.target.value })}
              />
            </label>
            <div className="deck-actions-panel">
              <button type="button" onClick={saveEffect}>효과 저장</button>
              <button type="button" onClick={deleteEffect}>효과 삭제</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
