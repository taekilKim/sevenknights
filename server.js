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

// ✅ 영웅 데이터 API
app.get("/heroes", async (req, res) => {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Airtable fetch error:", error);
    res.status(500).json({ error: "Failed to fetch heroes from Airtable" });
  }
});

// ✅ 정적 파일 (index.html, style.css) 제공
app.use(express.static("./"));

// ✅ Vercel 환경에서는 자동으로 포트를 할당하므로 3000 대신 process.env.PORT 사용
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
