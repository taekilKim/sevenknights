"use client";

import { useState } from "react";

import type { HeroDetail, Skill } from "@/lib/types";

type AdminHero = Omit<HeroDetail, "skills">;
type AdminSkill = Skill & {
  id?: string;
  linkedHeroes?: unknown;
};
type SkillKey = "attack" | "passive" | "active_1" | "active_2";

type Props = {
  heroes: AdminHero[];
};

const basicFields = [
  { key: "name", label: "이름" },
  { key: "nickname", label: "별명" },
  { key: "group", label: "소속" },
  { key: "rarity", label: "등급" },
  { key: "type", label: "타입" },
  { key: "portrait", label: "프로필 이미지 경로" },
  { key: "typeImage", label: "타입 아이콘 경로" },
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

const skillFields: Array<{ key: SkillKey; label: string }> = [
  { key: "attack", label: "기본 공격" },
  { key: "passive", label: "패시브" },
  { key: "active_1", label: "액티브 1" },
  { key: "active_2", label: "액티브 2" },
];

function cloneHero(hero: AdminHero | undefined): AdminHero {
  return JSON.parse(JSON.stringify(hero || {})) as AdminHero;
}

export function AdminHeroEditor({ heroes }: Props) {
  const [selectedId, setSelectedId] = useState(heroes[0]?.id || "");
  const selectedHero = heroes.find((hero) => hero.id === selectedId) || heroes[0];
  const [token, setToken] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [draft, setDraft] = useState<AdminHero>(() => cloneHero(selectedHero));
  const [status, setStatus] = useState("저장할 영웅을 선택하세요.");
  const [authStatus, setAuthStatus] = useState("어드민 토큰을 입력하면 편집 화면이 열립니다.");

  const selectHero = (id: string) => {
    const hero = heroes.find((entry) => entry.id === id);
    setSelectedId(id);
    setDraft(cloneHero(hero));
    setStatus(`${hero?.name || "영웅"} 데이터를 편집 중입니다.`);
  };

  const updateField = (key: keyof AdminHero, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: value || null,
    }));
  };

  const updateSkillField = (skillKey: SkillKey, field: "name" | "type" | "cooltime" | "image" | "description", value: string) => {
    setDraft((current) => {
      const previousSkill = current[skillKey] as AdminSkill | null;
      const nextSkill = {
        id: previousSkill?.id || `skill-${current.id}-${skillKey}`,
        name: previousSkill?.name || "",
        type: previousSkill?.type || (skillKey === "passive" ? "Passive" : skillKey === "attack" ? "Attack" : "Active"),
        description: previousSkill?.description || "",
        image: previousSkill?.image || null,
        cooltime: previousSkill?.cooltime ?? null,
        effects: previousSkill?.effects || [],
        ...(previousSkill?.linkedHeroes ? { linkedHeroes: previousSkill.linkedHeroes } : {}),
        [field]: value || null,
      };

      return {
        ...current,
        [skillKey]: nextSkill.name || nextSkill.description || nextSkill.image || nextSkill.cooltime ? nextSkill : null,
      };
    });
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

    const response = await fetch(`/api/admin/heroes/${encodeURIComponent(draft.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(draft),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.error || "저장에 실패했습니다.");
      return;
    }

    setStatus(`${payload?.hero?.name || draft.name} 저장 완료. 배포 반영은 커밋/푸시가 필요합니다.`);
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
          <h2>스킬</h2>
          <div className="admin-skill-stack">
            {skillFields.map((skillField) => {
              const skill = draft[skillField.key];

              return (
                <article key={skillField.key} className="admin-skill-card">
                  <h3>{skillField.label}</h3>
                  <div className="admin-form-grid">
                    <label>
                      <span>스킬명</span>
                      <input
                        value={skill?.name || ""}
                        onChange={(event) => updateSkillField(skillField.key, "name", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>분류</span>
                      <input
                        value={skill?.type || ""}
                        onChange={(event) => updateSkillField(skillField.key, "type", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>쿨타임</span>
                      <input
                        value={String(skill?.cooltime ?? "")}
                        onChange={(event) => updateSkillField(skillField.key, "cooltime", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>스킬 이미지 경로</span>
                      <input
                        value={skill?.image || ""}
                        onChange={(event) => updateSkillField(skillField.key, "image", event.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    <span>스킬 설명</span>
                    <textarea
                      className="admin-compact-textarea"
                      value={skill?.description || ""}
                      onChange={(event) => updateSkillField(skillField.key, "description", event.target.value)}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
