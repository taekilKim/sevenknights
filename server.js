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

// ====== Sitemap.xml 동적 생성 ======
app.get("/sitemap.xml", async (req, res) => {
  try {
    // 영웅 목록 가져오기
    const heroesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes?sort[0][field]=Name&sort[0][direction]=asc`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );

    if (!heroesRes.ok) {
      throw new Error(`Airtable Heroes API error: ${heroesRes.status}`);
    }

    const heroesData = await heroesRes.json();
    const heroes = heroesData.records.map(hero => ({
      name: hero.fields.Name || ""
    })).filter(h => h.name);

    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Sitemap XML 생성
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 홈페이지
    xml += '  <url>\n';
    xml += '    <loc>https://senadb.games/</loc>\n';
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // 영웅 도감 페이지
    xml += '  <url>\n';
    xml += '    <loc>https://senadb.games/index.html</loc>\n';
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // 티어 리스트
    xml += '  <url>\n';
    xml += '    <loc>https://senadb.games/tier-list.html</loc>\n';
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // FAQ
    xml += '  <url>\n';
    xml += '    <loc>https://senadb.games/faq.html</loc>\n';
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // 초보자 가이드
    xml += '  <url>\n';
    xml += '    <loc>https://senadb.games/beginner-guide.html</loc>\n';
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // 덱 빌더
    xml += '  <url>\n';
    xml += '    <loc>https://senadb.games/deck.html</loc>\n';
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';

    // 각 영웅 페이지
    heroes.forEach(hero => {
      xml += '  <url>\n';
      xml += `    <loc>https://senadb.games/hero.html?name=${encodeURIComponent(hero.name)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error("Sitemap generation error:", err);
    res.status(500).send('Error generating sitemap');
  }
});
// ====== End Sitemap ======

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
  // 캐시 방지 헤더 설정
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

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

    // ✅ Skills 테이블 전체 가져오기 (패시브 스킬 정보 포함용)
    let allSkills = [];
    let offset = null;
    do {
      const url = offset
        ? `https://api.airtable.com/v0/${BASE_ID}/Skills?offset=${offset}`
        : `https://api.airtable.com/v0/${BASE_ID}/Skills`;
      const skillsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      });
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        allSkills = allSkills.concat(skillsData.records || []);
        offset = skillsData.offset || null;
      } else {
        break;
      }
    } while (offset);

    // 스킬 ID로 매핑
    const skillsMap = {};
    for (const skillRecord of allSkills) {
      skillsMap[skillRecord.id] = skillRecord.fields;
    }

    // 영웅 데이터 구성 (요약 + 패시브 스킬)
    const processedHeroes = heroesData.records.map((hero) => {
      const f = hero.fields || {};
      const rarityVal = f.rarity || f.Rarity || "";
      const typeName = f.type || f.Type || "";
      const hasEffect = !!f.hasEffect; // ✅ 에어테이블 체크박스 필드 불러오기

      // 패시브 스킬 정보 가져오기
      const skills = [];
      const passiveSkillIds = f.passive || [];
      if (passiveSkillIds.length > 0 && skillsMap[passiveSkillIds[0]]) {
        const skillFields = skillsMap[passiveSkillIds[0]];
        skills.push({
          type: '패시브',
          name: skillFields.Name || "",
          description: skillFields.desc || "",
          image: Array.isArray(skillFields.image) && skillFields.image[0] ? skillFields.image[0].url : null
        });
      }

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
        skills, // ✅ 패시브 스킬 정보 추가
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

  // 캐시 방지 헤더 설정
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    const heroRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Heroes/${id}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
    );
    if (!heroRes.ok)
      throw new Error(`Airtable hero fetch error: ${heroRes.status}`);

    const heroData = await heroRes.json();
    const fields = heroData.fields || {};

    // 🔍 디버깅: 영웅 데이터 확인
    console.log(`\n🔍 영웅 조회: ${fields.Name || id}`);
    console.log(`📝 Description 필드:`, fields.Description ? '있음' : '없음');
    console.log(`📝 모든 필드 키:`, Object.keys(fields));

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

    // Skills 테이블 전체 가져오기 (pagination 처리)
    let allSkills = [];
    let offset = null;

    do {
      const url = offset
        ? `https://api.airtable.com/v0/${BASE_ID}/Skills?offset=${offset}`
        : `https://api.airtable.com/v0/${BASE_ID}/Skills`;

      const skillsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      });

      if (!skillsRes.ok) {
        const errText = await skillsRes.text();
        console.error("Airtable skills fetch error:", skillsRes.status, errText);
        throw new Error(`Airtable skills fetch error: ${skillsRes.status}`);
      }

      const skillsData = await skillsRes.json();
      allSkills = allSkills.concat(skillsData.records || []);
      offset = skillsData.offset || null;

      console.log(`📄 Skills 페이지 가져옴: ${skillsData.records?.length || 0}개, offset: ${offset || 'none'}`);
    } while (offset);

    console.log(`🎯 스킬 테이블 전체 레코드 수: ${allSkills.length}개`);

    // 스킬 ID로 매핑 & 역방향 매핑
    const skillsMap = {};
    for (const skillRecord of allSkills) {
      skillsMap[skillRecord.id] = skillRecord.fields;
    }
    console.log(`📋 skillsMap 생성 완료, 총 ${Object.keys(skillsMap).length}개 스킬`);

    // 헬퍼 함수: 스킬 데이터 생성
    const getSkillData = (skillId) => {
      const f = skillsMap[skillId];
      if (!f) {
        console.log(`  ❌ 스킬 ID "${skillId}" 를 skillsMap에서 찾을 수 없음`);
        return null;
      }
      const skillData = {
        name: f.Name || "",
        desc: f.desc || "",
        image: Array.isArray(f.image) && f.image[0] ? f.image[0].url : null,
        cooltime: f.cooltime || f.Cooltime || f.coolTime || f.cool_time || null,
      };
      console.log(`  ✅ 스킬 ID "${skillId}" → "${skillData.name}"`);
      return skillData;
    };

    // ✅ 방법 1: Heroes 테이블에 직접 링크된 스킬 ID 사용
    const attackSkillIds = fields.attack || [];
    const passiveSkillIds = fields.passive || [];
    const active1SkillIds = fields.active_1 || [];
    const active2SkillIds = fields.active_2 || [];

    console.log(`🔗 Direct Link 필드 값:`, {
      attack: attackSkillIds,
      passive: passiveSkillIds,
      active_1: active1SkillIds,
      active_2: active2SkillIds
    });

    let attackSkill = attackSkillIds[0] ? getSkillData(attackSkillIds[0]) : null;
    let passiveSkill = passiveSkillIds[0] ? getSkillData(passiveSkillIds[0]) : null;
    let active1Skill = active1SkillIds[0] ? getSkillData(active1SkillIds[0]) : null;
    let active2Skill = active2SkillIds[0] ? getSkillData(active2SkillIds[0]) : null;

    console.log(`🎲 Direct Link 결과:`, {
      attack: attackSkill?.name || 'null',
      passive: passiveSkill?.name || 'null',
      active_1: active1Skill?.name || 'null',
      active_2: active2Skill?.name || 'null'
    });

    // ✅ 방법 2: Fallback - Skills 테이블의 역방향 링크 사용 (기존 방식)
    if (!attackSkill || !passiveSkill || !active1Skill || !active2Skill) {
      console.log(`🔄 일부 스킬 누락, 역방향 링크로 재시도...`);

      for (const skillRecord of allSkills) {
        const f = skillRecord.fields || {};
        const skillData = {
          name: f.Name || "",
          desc: f.desc || "",
          image: Array.isArray(f.image) && f.image[0] ? f.image[0].url : null,
          cooltime: f.cooltime || f.Cooltime || f.coolTime || f.cool_time || null,
        };

        if (!attackSkill && (f.attack_hero || []).includes(id)) {
          attackSkill = skillData;
          console.log(`  ⚔️ 공격 스킬 발견 (역방향): ${skillData.name}`);
        }
        if (!passiveSkill && (f.passive_hero || []).includes(id)) {
          passiveSkill = skillData;
          console.log(`  🛡️ 패시브 스킬 발견 (역방향): ${skillData.name}`);
        }
        if (!active1Skill && (f.active_1_hero || []).includes(id)) {
          active1Skill = skillData;
          console.log(`  ✨ 액티브1 스킬 발견 (역방향): ${skillData.name}`);
        }
        if (!active2Skill && (f.active_2_hero || []).includes(id)) {
          active2Skill = skillData;
          console.log(`  💫 액티브2 스킬 발견 (역방향): ${skillData.name}`);
        }
      }
    }

    console.log(`📊 최종 스킬 매칭 결과:`, {
      attack: attackSkill?.name || 'null',
      passive: passiveSkill?.name || 'null',
      active_1: active1Skill?.name || 'null',
      active_2: active2Skill?.name || 'null'
    });

    // ✅ 응답 구성
    const typeName = pick(fields, ["type", "Type"]);
    const description = pick(fields, ["Description", "description"]);

    // ✅ 디버깅: 모든 필드 키 확인
    console.log(`🔍 사용 가능한 필드 키:`, Object.keys(fields).join(', '));

    const historyRaw = pick(fields, ["history", "History", "updateHistory", "UpdateHistory", "업데이트 히스토리", "히스토리"]);

    // 🔍 디버깅: history 필드의 원본 값 확인
    console.log(`🔍 History 필드 원본 값:`, historyRaw);
    console.log(`🔍 History 필드 타입:`, typeof historyRaw);

    // 모든 필드 키 중 history와 유사한 것 찾기
    const historyLikeKeys = Object.keys(fields).filter(key =>
      key.toLowerCase().includes('history') ||
      key.toLowerCase().includes('히스토리') ||
      key.toLowerCase().includes('업데이트')
    );
    console.log(`🔍 History 관련 필드 키들:`, historyLikeKeys);
    historyLikeKeys.forEach(key => {
      console.log(`  - ${key}:`, fields[key]);
    });

    // history 파싱: JSON 또는 텍스트 형식 지원
    let history = [];
    if (historyRaw) {
      // 먼저 JSON 파싱 시도
      try {
        // Trailing comma 제거 (JSON5 스타일 지원)
        let cleanedJson = historyRaw
          .replace(/,\s*}/g, '}')  // 객체 끝의 trailing comma 제거
          .replace(/,\s*]/g, ']'); // 배열 끝의 trailing comma 제거

        console.log(`🔧 JSON 정리 시도...`);
        const parsed = JSON.parse(cleanedJson);
        if (Array.isArray(parsed)) {
          history = parsed;
          console.log(`✅ History JSON 파싱 성공: ${history.length}개 엔트리`);
        } else {
          console.log(`⚠️ History가 배열이 아님, 텍스트 파싱으로 전환`);
          throw new Error('Not an array');
        }
      } catch (e) {
        // JSON 파싱 실패 시 텍스트 형식으로 파싱
        console.log(`📝 History를 텍스트 형식으로 파싱 시도 (JSON 오류: ${e.message})`);
        history = parseHistoryText(historyRaw);
        console.log(`✅ History 텍스트 파싱 완료: ${history.length}개 엔트리`);
      }
    } else {
      console.log(`⚠️ historyRaw가 null 또는 undefined입니다`);
    }

    // 텍스트 형식 history 파싱 함수
    function parseHistoryText(text) {
      console.log(`🔍 parseHistoryText 입력 (길이 ${text.length}자):`, text.substring(0, 200));

      const entries = [];
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      console.log(`🔍 파싱할 줄 수: ${lines.length}개`);
      lines.forEach((line, idx) => {
        console.log(`  줄 ${idx}: "${line}"`);
      });

      // 날짜 패턴: YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD
      const datePattern = /^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(datePattern);

        if (match) {
          // 날짜 발견
          const date = line;
          const content = lines[i + 1] || ''; // 다음 줄이 내용

          console.log(`  ✅ 날짜 발견: ${date}, 내용: ${content}`);

          entries.push({
            date: date,
            content: content
          });

          i++; // 다음 줄(내용)을 건너뛰기
        } else {
          console.log(`  ❌ 날짜 패턴 불일치: "${line}"`);
        }
      }

      console.log(`🔍 파싱 결과: ${entries.length}개 엔트리`);
      return entries;
    }

    console.log(`📖 Description 값:`, description ? `"${description.substring(0, 30)}..."` : 'null');
    console.log(`📜 History 최종 엔트리 수:`, history.length);

    const responseData = {
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

      description: description,
      history: history,
      hasEffect: !!fields.hasEffect, // ✅ 추가됨
      transLevel: pick(fields, ["transLevel", "TransLevel", "초월", "초월레벨"]) // ✅ 초월 레벨 정보
    };

    console.log(`✅ 최종 응답 데이터 구성 완료\n`);
    res.json(responseData);
  } catch (error) {
    console.error("Failed to fetch hero:", error);
    res.status(500).json({ error: "Failed to fetch hero details" });
  }
});

// ✅ 스킬 효과(Effects) 테이블 조회 API
app.get("/api/effects", async (req, res) => {
  // 캐시 방지 헤더 설정
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    // Effects 테이블 전체 가져오기 (pagination 처리)
    let allEffects = [];
    let offset = null;

    do {
      const url = offset
        ? `https://api.airtable.com/v0/${BASE_ID}/Effects?offset=${offset}`
        : `https://api.airtable.com/v0/${BASE_ID}/Effects`;

      const effectsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      });

      if (!effectsRes.ok) {
        const errText = await effectsRes.text();
        console.error("Airtable effects fetch error:", effectsRes.status, errText);
        throw new Error(`Airtable effects fetch error: ${effectsRes.status}`);
      }

      const effectsData = await effectsRes.json();
      allEffects = allEffects.concat(effectsData.records || []);
      offset = effectsData.offset || null;

      console.log(`📄 Effects 페이지 가져옴: ${effectsData.records?.length || 0}개, offset: ${offset || 'none'}`);
    } while (offset);

    console.log(`🎯 Effects 테이블 전체 레코드 수: ${allEffects.length}개`);

    // 효과 데이터 포맷팅
    const processedEffects = allEffects.map(effect => {
      const f = effect.fields || {};
      return {
        id: effect.id,
        name: f.Name || f.name || "",
        description: f.Description || f.description || f.desc || "",
        hasVariable: !!f.HasVariable || !!f.hasVariable,
        icon: Array.isArray(f.Icon) && f.Icon[0] ? f.Icon[0].url : null,
        color: f.Color || f.color || null
      };
    });

    res.json(processedEffects);
  } catch (error) {
    console.error("Failed to fetch effects:", error);
    res.status(500).json({ error: "Failed to fetch effects" });
  }
});

// ✅ 단일 영웅 이름 기반 조회 API
app.get("/api/hero/name/:name", async (req, res) => {
  const { name } = req.params;

  // 캐시 방지 헤더 설정
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

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

    // /api/hero/:id로 리다이렉트
    return res.redirect(308, `/api/hero/${heroId}`);
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
