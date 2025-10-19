// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.static(".")); // index.html, style.css 정적 파일 제공

// Airtable 설정
const AIRTABLE_TOKEN = "patvJ6Be04l4gfx9S.0bb6db9ad0bbd989734eebafae4f5809e644955c000da45ab022cfa48210f26a";
const BASE_ID = "app6CjXEVBGVvatUd"; // Airtable Base ID
const HERO_TABLE = "Heroes"; // 영웅 테이블 이름
const SKILL_TABLE = "Skills"; // 연결된 스킬 테이블 이름 (선택적)

// 기본 영웅 리스트 API
app.get("/heroes", async (req, res) => {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${HERO_TABLE}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
    });
    const data = await response.json();

    // Airtable 응답 확인용 로그
    console.log("✅ Airtable Heroes response:");
    console.dir(data, { depth: null });

    // 응답 데이터 검증
    if (!data.records) {
      console.error("❌ Airtable 응답에 records 필드가 없습니다:", data);
      return res.status(500).json({ error: "Invalid Airtable response", data });
    }

    res.json(data);
  } catch (error) {
    console.error("🔥 Airtable fetch error:", error);
    res.status(500).json({ error: "Airtable fetch failed" });
  }
});

// 연결된 스킬 데이터 API (모달에서 호출)
app.get("/skills", async (req, res) => {
  const ids = req.query.ids;
  if (!ids) return res.status(400).json({ error: "No IDs provided" });

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${SKILL_TABLE}?filterByFormula=OR(${ids
        .split(",")
        .map((id) => `RECORD_ID()='${id}'`)
        .join(",")})`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      }
    );
    const data = await response.json();

    console.log("✅ Airtable Skills response:");
    console.dir(data, { depth: null });

    if (!data.records) {
      console.error("❌ Skills 응답 오류:", data);
      return res.status(500).json({ error: "Invalid Skills response", data });
    }

    res.json(data);
  } catch (error) {
    console.error("🔥 Skill fetch error:", error);
    res.status(500).json({ error: "Skill fetch failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ 서버 실행 중 → http://localhost:${PORT}`));