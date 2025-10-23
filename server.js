// server.js (Vercel 호스팅용)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// ✅ Airtable 연결 설정
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN; // 환경 변수에서 가져옴
const BASE_ID = "app6CjXEVBGVvatUd"; // Airtable Base ID
const TABLE = "Heroes"; // Airtable 테이블 이름

// ✅ 영웅 목록 + 타입 이미지 API
app.get("/heroes", async (req, res) => {
  try {
    // 영웅 목록 (Name 기준 오름차순)
    const heroesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes?sort[0][field]=Name&sort[0][direction]=asc`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      }
    );
    if (!heroesRes.ok)
      throw new Error(`Airtable Heroes API error: ${heroesRes.status}`);
    const heroesData = await heroesRes.json();

    // 타입 테이블 불러오기
    const typesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Type`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      }
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
        if (name && url) {
          typeImageMap[name] = url;
        }
      }
    }

    // 영웅 목록에 typeImage 포함
    const processedHeroes = [];
    if (Array.isArray(heroesData.records)) {
      for (const hero of heroesData.records) {
        const fields = hero.fields || {};
        const typeName = fields.type || fields.Type || null;
        processedHeroes.push({
          id: hero.id, // ✅ Airtable 레코드 ID
          name: fields.name || fields.Name || null,
          type: fields.type || fields.Type || null,
          rarity: fields.rarity || fields.Rarity || null,
          portrait: Array.isArray(fields.portrait)
            ? fields.portrait[0]?.url
            : Array.isArray(fields.Portrait)
            ? fields.Portrait[0]?.url
            : null,
          typeImage: typeImageMap[typeName] || null,
        });
      }
    }

    res.json({ records: processedHeroes });
  } catch (error) {
    console.error("Airtable fetch error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch heroes and types from Airtable" });
  }
});

// ✅ 단일 영웅 조회 API (API prefix 적용)
app.get("/api/hero/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const heroRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes/${id}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      }
    );

    if (!heroRes.ok)
      throw new Error(`Airtable hero fetch error: ${heroRes.status}`);

    const heroData = await heroRes.json();
    const fields = heroData.fields || {};

    const heroDetail = {
      id: heroData.id,
      name: fields.Name || null,
      type: fields.Type || null,
      rarity: fields.Rarity || null,
      portrait: Array.isArray(fields.Portrait)
        ? fields.Portrait[0]?.url
        : null,
      description: fields.Description || null, // 설명 필드
    };

    res.json(heroDetail);
  } catch (error) {
    console.error("Failed to fetch hero:", error);
    res.status(500).json({ error: "Failed to fetch hero details" });
  }
});

// ✅ 정적 파일 서빙 (가장 마지막에 적용)
app.use(express.static("public", { extensions: ["html", "htm"] }));

// ✅ 포트 설정 (Vercel 환경에 맞춤)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
