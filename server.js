// server.js (Vercel 호스팅용)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
// ✅ Express 정적 파일 설정 (public 폴더 내 모든 이미지, CSS, JS 접근 가능)
app.use(cors());
app.use(express.static("public", { extensions: ["html", "htm"] }));

// ✅ Airtable 연결 설정
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN; // 환경 변수에서 가져옴
const BASE_ID = "app6CjXEVBGVvatUd"; // Airtable Base ID
const TABLE = "Heroes"; // Airtable 테이블 이름

// ✅ 영웅 데이터 API
// ✅ 영웅 데이터 + 타입 이미지 API
app.get("/heroes", async (req, res) => {
  try {
    // Fetch Heroes
    const heroesRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Heroes`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });
    if (!heroesRes.ok) throw new Error(`Airtable Heroes API error: ${heroesRes.status}`);
    const heroesData = await heroesRes.json();

    // Fetch Types
    const typesRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Type`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });
    if (!typesRes.ok) throw new Error(`Airtable Type API error: ${typesRes.status}`);
    const typesData = await typesRes.json();

    // Create a map of type name -> attachment URL
    const typeImageMap = {};
    if (Array.isArray(typesData.records)) {
      for (const typeRecord of typesData.records) {
        const name = typeRecord.fields && typeRecord.fields.Name;
        const attachments = typeRecord.fields && typeRecord.fields.Attachments;
        // attachment is an array of objects with url
        const url = Array.isArray(attachments) && attachments[0] && attachments[0].url;
        if (name && url) {
          typeImageMap[name] = url;
        }
      }
    }

    // Process heroes to include typeImage and normalized structure
    const processedHeroes = [];
    if (Array.isArray(heroesData.records)) {
      for (const hero of heroesData.records) {
        const fields = hero.fields || {};
        const typeName = fields.type || fields.Type || null;
        processedHeroes.push({
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
    res.status(500).json({ error: "Failed to fetch heroes and types from Airtable" });
  }
});


// ✅ Vercel 환경에서는 자동으로 포트를 할당하므로 3000 대신 process.env.PORT 사용
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
