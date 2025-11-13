// server.js (Vercel + public 폴더 구조용)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json()); // ✅ 추가

// Airtable 설정
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "app6CjXEVBGVvatUd";
const COMMENTS_TABLE = process.env.AIRTABLE_COMMENTS_TABLE || "Comments";


console.log("🔑 Airtable Token:", AIRTABLE_TOKEN ? "✅ Loaded" : "❌ Missing");
console.log("📁 Base ID:", BASE_ID);

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

      const heroData = {
        id: hero.id,
        name: f.Name || "",
        rarity: rarityVal,
        type: typeName,
        group: f.group || "", // ✅ 영웅 소속군 (UI 미노출, 정렬/필터용)
        hasEffect, // ✅ 추가됨
        portrait:
          Array.isArray(f.portrait) && f.portrait[0]
            ? f.portrait[0].thumbnails?.large?.url || f.portrait[0].url
            : "",
        typeImage: typeImageMap[typeName] || null,
      };

      // ✅ group 필드 디버깅용 출력
      if (!heroData.group) {
        console.warn(`⚠️ 그룹 누락: ${heroData.name}`);
      } else {
        console.log(`🧩 ${heroData.name} → 그룹: ${heroData.group}`);
      }

      return heroData;
    });

    let filteredHeroes = processedHeroes;

    // ✅ group/type 필터링 지원 추가
    const { group, type } = req.query;
    if (group) {
      filteredHeroes = filteredHeroes.filter(h => h.group && h.group === group);
    }
    if (type) {
      filteredHeroes = filteredHeroes.filter(h => h.type && h.type === type);
    }

    res.json(filteredHeroes);
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

    // Fetch Type table for type image
    const typesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Type`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!typesRes.ok)
      throw new Error(`Airtable Type API error: ${typesRes.status}`);
    const typesData = await typesRes.json();

    // Type image mapping
    const typeImageMap = {};
    if (Array.isArray(typesData.records)) {
      for (const typeRecord of typesData.records) {
        const name = typeRecord.fields?.Name;
        const attachments = typeRecord.fields?.Attachments;
        const url = Array.isArray(attachments) && attachments[0] && attachments[0].url;
        if (name && url) typeImageMap[name] = url;
      }
    }

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
        cooltime: f.cooltime || f.Cooltime || f.coolTime || f.cool_time || null,
      };

      if ((f.attack_hero || []).includes(id)) attackSkill = skillData;
      if ((f.passive_hero || []).includes(id)) passiveSkill = skillData;
      if ((f.active_1_hero || []).includes(id)) active1Skill = skillData;
      if ((f.active_2_hero || []).includes(id)) active2Skill = skillData;
    }

    // ✅ 응답 구성
    const typeName = pick(fields, ["type", "Type"]);
    res.json({
      id: heroData.id,
      name: pick(fields, ["Name"]),
      nickname: pick(fields, ["nickname"]),
      group: pick(fields, ["group"]),
      rarity: pick(fields, ["rarity", "Rarity"]),
      type: typeName,
      typeImage: typeImageMap[typeName] || null,
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

// ✅ 단일 영웅 이름 기반 조회 API
app.get("/api/hero/name/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const heroesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes?filterByFormula=({Name}='${decodeURIComponent(name)}')`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!heroesRes.ok)
      throw new Error(`Airtable hero fetch error: ${heroesRes.status}`);
    const heroesData = await heroesRes.json();
    if (!heroesData.records || heroesData.records.length === 0)
      return res.status(404).json({ error: "영웅을 찾을 수 없습니다." });
    const heroRecord = heroesData.records[0];
    const heroId = heroRecord.id;
    // 기존 /api/hero/:id 로직 재사용
    const heroDetailRes = await fetch(`https://sena-rebirth-guidebook.app/api/hero/${heroId}`);
    const heroDetail = await heroDetailRes.json();
    res.json(heroDetail);
  } catch (error) {
    console.error("Failed to fetch hero by name:", error);
    res.status(500).json({ error: "Failed to fetch hero by name" });
  }
});

// ✅ public 폴더 정적 파일 서빙
app.use(express.static("public", { extensions: ["html", "htm"] }));

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


// import bodyParser from "body-parser";
// app.use(bodyParser.json());

// ✅ 댓글 목록 조회 (간소화된 안정화 버전)
app.get("/api/comments/:heroId", async (req, res) => {
  const heroId = req.params.heroId;
  try {
    const commentsRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${COMMENTS_TABLE}?filterByFormula={heroId}='${heroId}'`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );

    if (!commentsRes.ok) {
      const errText = await commentsRes.text();
      console.error("❌ Airtable 댓글 조회 오류:", commentsRes.status, errText);
      return res.status(500).json({ error: "댓글 불러오기 실패", details: errText });
    }

    const data = await commentsRes.json();
    const comments = (data.records || []).map((rec) => ({
      id: rec.id,
      nickname: rec.fields.nickname || "익명",
      content: rec.fields.content || "",
      // createdTime는 Airtable 시스템 필드라 항상 존재
      timestamp: rec.createdTime || rec.fields.timestamp || "",
    }));

    res.json({ comments });
  } catch (error) {
    console.error("❌ 댓글 불러오기 예외:", error);
    res.status(500).json({ error: "댓글 불러오기 실패", details: String(error) });
  }
});

// ✅ 댓글 등록 API (간소화된 안정화 버전)

app.post("/api/comments/:heroId", async (req, res) => {
  const heroId = req.params.heroId;
  const { nickname, content } = req.body || {};

  console.log("🪶 서버가 받은 데이터(테스트 버전):", { heroId, nickname, content });
  if (!nickname || !content) {
    return res.status(400).json({ error: "닉네임과 내용을 모두 입력하세요." });
  }

  try {
    const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${COMMENTS_TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      // ⚠️ timestamp는 Airtable 'Created time' 필드로 대체되므로 보내지 않습니다.
      /* body: JSON.stringify({
        fields: { heroId: [heroId], nickname, content }
      }), */
      body: JSON.stringify({
        fields: { heroId, nickname, content }
      }),
    });

    const text = await resp.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}

    if (!resp.ok) {
      console.error("❌ Airtable 댓글 등록 실패:", resp.status, text);
      return res.status(500).json({ error: "댓글 등록 실패", details: text });
    }

    console.log("✅ Airtable 댓글 등록 성공:", json);
    res.json({ success: true, record: json });
  } catch (error) {
    console.error("❌ 서버 처리 오류:", error);
    res.status(500).json({ error: "댓글 등록 실패", details: String(error) });
  }
});


// =============================
// 📄 Dynamic Sitemap Generator
// =============================
app.get('/sitemap.xml', async (req, res) => {
  try {
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Heroes`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });
    const data = await airtableResponse.json();
    const heroes = data.records || [];

    const urls = heroes.map(record => {
      const id = record.id;
      const name = record.fields && record.fields.Name ? record.fields.Name : '';
      return `
        <url>
          <loc>https://sena-rebirth-guidebook.app/hero.html?name=${encodeURIComponent(name)}</loc>
          <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
          <priority>0.8</priority>
        </url>
      `;
    }).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://sena-rebirth-guidebook.app/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <priority>1.0</priority>
      </url>
      ${urls}
    </urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error('Sitemap generation failed:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// ✅ Vercel용 export
export default app;
