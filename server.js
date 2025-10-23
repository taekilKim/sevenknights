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

// ✅ 영웅 목록 API
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

    // 타입 이름 → 이미지 URL 매핑
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

    // 영웅 데이터 구성
    const processedHeroes = [];
    if (Array.isArray(heroesData.records)) {
      for (const hero of heroesData.records) {
        const fields = hero.fields || {};
        const typeName = fields.type || fields.Type || null;
        const rarityVal = fields.Rarity || fields.rarity || null;
        processedHeroes.push({
          id: hero.id,
          name: fields.Name || fields.name || null,
          type: fields.Type || fields.type || null,
          rarityColor: rarityColorMap[rarityVal] || null,
          portrait:
            Array.isArray(fields.portrait)
              ? fields.portrait[0]?.thumbnails?.large?.url || fields.portrait[0]?.url
              : Array.isArray(fields.Portrait)
              ? fields.Portrait[0]?.thumbnails?.large?.url || fields.Portrait[0]?.url
              : Array.isArray(fields["초상"])
              ? fields["초상"][0]?.thumbnails?.large?.url || fields["초상"][0]?.url
              : Array.isArray(fields["이미지"])
              ? fields["이미지"][0]?.thumbnails?.large?.url || fields["이미지"][0]?.url
              : null,
          typeImage: typeImageMap[typeName] || null,
        });
      }
    }

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

    // Fetch skills for the hero
    const skillsRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Skills?filterByFormula={hero_id}='${id}'`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!skillsRes.ok)
      throw new Error(`Airtable skills fetch error: ${skillsRes.status}`);

    const skillsData = await skillsRes.json();

    // Extract skills by skill type
    let passiveSkill = null;
    let active1Skill = null;
    let active2Skill = null;
    if (Array.isArray(skillsData.records)) {
      for (const skillRecord of skillsData.records) {
        const skillFields = skillRecord.fields || {};
        const skillType = skillFields.skill_type || skillFields["skill_type"] || "";
        if (skillType.toLowerCase() === "passive") {
          passiveSkill = skillFields.passive || skillFields.Passive || skillFields.description || null;
        } else if (skillType.toLowerCase() === "active 1" || skillType.toLowerCase() === "active1") {
          active1Skill = skillFields.active_1 || skillFields["active_1"] || skillFields.description || null;
        } else if (skillType.toLowerCase() === "active 2" || skillType.toLowerCase() === "active2") {
          active2Skill = skillFields.active_2 || skillFields["active_2"] || skillFields.description || null;
        }
      }
    }

    res.json({
      id: heroData.id,
      // 기본
      name: pick(fields, ["Name"]),
      nickname: pick(fields, ["nickname"]),
      group: pick(fields, ["group"]),
      rarity: pick(fields, ["rarity", "Rarity"]),
      type: pick(fields, ["type", "Type"]),
      portrait: pickAttachmentUrl(fields, ["portrait", "Portrait", "초상", "이미지"]),

      // 스탯 (영문 키 우선, 없으면 한글 키)
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

      // 스킬 (attack data from hero, others from skills)
      attack_image: pickAttachmentUrl(fields, ["attack image", "attack_image"]),
      attack_name: pick(fields, ["attack name", "attack_name"]),
      attack_desc: pick(fields, ["attack description", "attack_desc"]),
      passive: passiveSkill,
      active_1: active1Skill,
      active_2: active2Skill,

      // 설명
      description: pick(fields, ["Description"])
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
