// server.js (Vercel 호스팅용)

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "app6CjXEVBGVvatUd";
const TABLE = "Heroes";

// ✅ 영웅 목록 API
app.get("/api/heroes", async (req, res) => {
  try {
    const heroesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes?sort[0][field]=Name&sort[0][direction]=asc`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      }
    );
    if (!heroesRes.ok)
      throw new Error(`Airtable Heroes API error: ${heroesRes.status}`);
    const heroesData = await heroesRes.json();

    const typesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Type`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      }
    );
    if (!typesRes.ok)
      throw new Error(`Airtable Type API error: ${typesRes.status}`);
    const typesData = await typesRes.json();

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

    const processedHeroes = [];
    if (Array.isArray(heroesData.records)) {
      for (const hero of heroesData.records) {
        const fields = hero.fields || {};
        const typeName = fields.type || fields.Type || null;
        processedHeroes.push({
          id: hero.id,
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

// ✅ 단일 영웅 조회 API
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
      portrait: Array.isArray(fields.Portrait) ? fields.Portrait[0]?.url : null,
      description: fields.Description || null,
    };

    res.json(heroDetail);
  } catch (error) {
    console.error("Failed to fetch hero:", error);
    res.status(500).json({ error: "Failed to fetch hero details" });
  }
});

app.use(express.static("public", { extensions: ["html", "htm"] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

export default app;
