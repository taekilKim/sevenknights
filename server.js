// server.js (Vercel + public 폴더 구조용)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// Airtable 설정
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "app6CjXEVBGVvatUd";

// -------- helpers --------
const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj && Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : undefined;
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

const pickAttachmentUrl = (obj, keys) => {
  for (const k of keys) {
    const arr = obj && obj[k];
    if (Array.isArray(arr) && arr[0]) {
      return arr[0]?.thumbnails?.large?.url || arr[0]?.url || null;
    }
  }
  return null;
};

const rarityColorMap = {
  "전설+": "#f9b233",
  "전설": "#ffdf80",
  "희귀": "#63a4ff",
  "일반": "#aaaaaa",
};
// -------------------------

// ✅ 영웅 목록 API (요약 정보만)
app.get("/api/heroes", async (req, res) => {
  try {
    const heroesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes?sort[0][field]=Name&sort[0][direction]=asc`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!heroesRes.ok)
      throw new Error(`Airtable Heroes API error: ${heroesRes.status}`);
    const heroesData = await heroesRes.json();

    const typesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Type`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!typesRes.ok)
      throw new Error(`Airtable Type API error: ${typesRes.status}`);
    const typesData = await typesRes.json();

    // 타입 이미지 매핑
    const typeImageMap = {};
    if (Array.isArray(typesData.records)) {
      for (const typeRecord of typesData.records) {
        const name = typeRecord.fields?.Name;
        const attachments = typeRecord.fields?.Attachments;
        const url =
          Array.isArray(attachments) && attachments[0] && attachments[0].url;
        if (name && url) typeImageMap[name] = url;
      }
    }

    // 영웅 데이터 구성 (요약)
    const processedHeroes = heroesData.records.map((hero) => {
      const f = hero.fields || {};
      const rarityVal = f.rarity || f.Rarity || "";
      const typeName = f.type || f.Type || "";
      const hasEffect = !!f.hasEffect; // ✅ 에어테이블 체크박스 필드 불러오기

      return {
        id: hero.id,
        name: f.Name || "",
        rarity: rarityVal,
        type: typeName,
        hasEffect, // ✅ 추가됨
        portrait:
          Array.isArray(f.portrait) && f.portrait[0]
            ? f.portrait[0].thumbnails?.large?.url || f.portrait[0].url
            : "",
        typeImage: typeImageMap[typeName] || null,
      };
    });

    res.json({ records: processedHeroes });
  } catch (error) {
    console.error("Airtable fetch error:", error);
    res.status(500).json({ error: "Failed to fetch heroes" });
  }
});

// ✅ 단일 영웅 조회 API
app.get("/api/hero/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const heroRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes/${id}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!heroRes.ok)
      throw new Error(`Airtable hero fetch error: ${heroRes.status}`);

    const heroData = await heroRes.json();
    const fields = heroData.fields || {};

    /*
      기존 스킬 조회 로직 (주석 처리 및 제거됨):
      - filterByFormula를 사용하여 Skills 테이블에서 해당 영웅 ID가 포함된 레코드를 검색.
      - 이 방식은 Airtable의 formula 검색에 의존하여, 배열 필드 내 ID 검색이 정확하지 않을 수 있음.
      - 또한, formula 내 문자열 삽입 시 인젝션 위험 및 쿼리 복잡성 문제가 존재.
      - 따라서 아래와 같이 링크드 레코드 필드를 직접 조회하는 방식으로 변경함.

      // const skillsRes = await fetch(
      //   `https://api.airtable.com/v0/${BASE_ID}/Skills?filterByFormula=SEARCH('${id}', ARRAYJOIN({Heroes}))`,
      //   { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
      // );
      // if (!skillsRes.ok) {
      //   const errText = await skillsRes.text();
      //   console.error("Airtable skills fetch error:", skillsRes.status, errText);
      //   throw new Error(`Airtable skills fetch error: ${skillsRes.status}`);
      // }
      // const skillsData = await skillsRes.json();
    */

    // ----------------------------------------------
    // 새로운 스킬 조회 로직:
    // - Skills 테이블에서 모든 레코드를 가져와서,
    //   각 스킬의 'Heroes' 링크드 레코드 필드에 현재 영웅 ID가 포함되어 있는지 확인.
    // - 이렇게 하면 Airtable API의 공식 링크드 레코드 관계를 직접 활용하며,
    //   filterByFormula보다 안전하고 정확함.
    // - 또한, 스킬 타입별(passive, active 1, active 2)로 분류하여 필요한 필드를 추출.
    // - Airtable에서 가져오는 필드는 다음과 같음:
    //   skill_type (스킬 유형), passive, active_1, active_2, description 등.
    //
    //  새로운 방식은:
    //  1) Skills 테이블 전체를 가져와서,
    //  2) 각 스킬의 링크드 레코드 필드 'Heroes'를 검사,
    //  3) 매칭되는 스킬만 필터링하여 사용.
    //
    //  이렇게 하면 Airtable 공식 API의 링크드 레코드 기능을 활용하며
    //  쿼리 오류나 인젝션 위험 없이 안정적임.
    // ----------------------------------------------

    const skillsRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Skills`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!skillsRes.ok) {
      const errText = await skillsRes.text();
      console.error("Airtable skills fetch error:", skillsRes.status, errText);
      throw new Error(`Airtable skills fetch error: ${skillsRes.status}`);
    }

    const skillsData = await skillsRes.json();

    // ✅ 영웅과 연결된 스킬 찾기
    let attackSkill = null;
    let passiveSkill = null;
    let active1Skill = null;
    let active2Skill = null;

    for (const skillRecord of skillsData.records || []) {
      const f = skillRecord.fields || {};

      const skillData = {
        name: f.Name || "",
        desc: f.desc || "",
        image: Array.isArray(f.image) && f.image[0] ? f.image[0].url : null,
      };

      if ((f.attack_hero || []).includes(id)) attackSkill = skillData;
      if ((f.passive_hero || []).includes(id)) passiveSkill = skillData;
      if ((f.active_1_hero || []).includes(id)) active1Skill = skillData;
      if ((f.active_2_hero || []).includes(id)) active2Skill = skillData;
    }

    // ✅ 응답 구성
    res.json({
      id: heroData.id,
      name: pick(fields, ["Name"]),
      nickname: pick(fields, ["nickname"]),
      group: pick(fields, ["group"]),
      rarity: pick(fields, ["rarity", "Rarity"]),
      type: pick(fields, ["type", "Type"]),
      portrait: pickAttachmentUrl(fields, ["portrait", "Portrait", "초상", "이미지"]),
      atk: pick(fields, ["atk", "공격력"]),
      def: pick(fields, ["def", "방어력"]),
      hp: pick(fields, ["hp", "생명력"]),
      spd: pick(fields, ["spd", "속공"]),
      crit_rate: pick(fields, ["crit_rate", "치명타 확률(%)"]),
      crit_dmg: pick(fields, ["crit_dmg", "치명타 피해(%)"]),
      weak_rate: pick(fields, ["weak_rate", "약점 공격 확률(%)"]),
      block_rate: pick(fields, ["block_rate", "막기 확률(%)"]),
      dmg_reduce: pick(fields, ["dmg_reduce", "받는 피해 감소(%)"]),
      eff_hit: pick(fields, ["eff_hit", "효과 적중(%)"]),
      eff_res: pick(fields, ["eff_res", "효과 저항(%)"]),

      // ✅ 통합된 스킬 정보
      attack: attackSkill,
      passive: passiveSkill,
      active_1: active1Skill,
      active_2: active2Skill,

      description: pick(fields, ["Description"]),
      hasEffect: !!fields.hasEffect // ✅ 추가됨
    });
  } catch (error) {
    console.error("Failed to fetch hero:", error);
    res.status(500).json({ error: "Failed to fetch hero details" });
  }
});

// ✅ public 폴더 정적 파일 서빙
app.use(express.static("public", { extensions: ["html", "htm"] }));

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ✅ Vercel용 export
export default app;
