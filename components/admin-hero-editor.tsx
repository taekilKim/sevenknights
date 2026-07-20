"use client";

import { useState } from "react";

import type { HeroDetail } from "@/lib/types";

type AdminHero = Omit<HeroDetail, "skills">;

type Props = {
  heroes: AdminHero[];
};

export function AdminHeroEditor({ heroes }: Props) {
  const [selectedId, setSelectedId] = useState(heroes[0]?.id || "");
  const selectedHero = heroes.find((hero) => hero.id === selectedId) || heroes[0];
  const [token, setToken] = useState("");
  const [draft, setDraft] = useState(() => JSON.stringify(selectedHero || {}, null, 2));
  const [status, setStatus] = useState("저장할 영웅을 선택하세요.");

  const selectHero = (id: string) => {
    const hero = heroes.find((entry) => entry.id === id);
    setSelectedId(id);
    setDraft(JSON.stringify(hero || {}, null, 2));
    setStatus(`${hero?.name || "영웅"} 데이터를 편집 중입니다.`);
  };

  const saveHero = async () => {
    setStatus("저장 중입니다...");

    let parsed: AdminHero;
    try {
      parsed = JSON.parse(draft) as AdminHero;
    } catch {
      setStatus("JSON 형식이 올바르지 않습니다.");
      return;
    }

    if (!parsed.id) {
      setStatus("영웅 id는 반드시 필요합니다.");
      return;
    }

    const response = await fetch(`/api/admin/heroes/${encodeURIComponent(parsed.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(parsed),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(payload?.error || "저장에 실패했습니다.");
      return;
    }

    setStatus(`${payload?.hero?.name || parsed.name} 저장 완료. 배포 반영은 커밋/푸시가 필요합니다.`);
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <label htmlFor="admin-token">어드민 토큰</label>
        <input
          id="admin-token"
          type="password"
          placeholder="ADMIN_TOKEN"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

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
          JSON 저장
        </button>
      </aside>

      <section className="admin-editor-card">
        <div>
          <span>Hero JSON</span>
          <strong>{selectedHero?.name || "영웅 데이터"}</strong>
        </div>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck={false} />
      </section>
    </div>
  );
}
