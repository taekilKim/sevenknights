import "server-only";

import { cache } from "react";

import type { CommentRecord, Effect, HeroDetail, HeroSummary, Skill } from "@/lib/types";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "app6CjXEVBGVvatUd";
const COMMENTS_TABLE = process.env.AIRTABLE_COMMENTS_TABLE || "Comments";

export const hasAirtableConfig = Boolean(AIRTABLE_TOKEN);

function assertToken() {
  if (!AIRTABLE_TOKEN) {
    throw new Error("AIRTABLE_TOKEN is not configured.");
  }
}

async function airtableFetch<T>(path: string, init?: RequestInit): Promise<T> {
  assertToken();

  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    next: {
      revalidate: init?.method && init.method !== "GET" ? 0 : 300,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${details}`);
  }

  return response.json() as Promise<T>;
}

type AirtableListResponse<T> = {
  records: Array<{ id: string; fields: T; createdTime?: string }>;
  offset?: string;
};

const pick = (obj: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const pickAttachmentUrl = (obj: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    const items = obj?.[key];
    if (Array.isArray(items) && items[0] && typeof items[0] === "object") {
      const attachment = items[0] as {
        url?: string;
        thumbnails?: { large?: { url?: string } };
      };
      return attachment.thumbnails?.large?.url || attachment.url || null;
    }
  }
  return null;
};

const optimizeImageUrl = (url: string | null, width = 640, quality = 80) => {
  if (!url) {
    return "";
  }

  if (url.startsWith("/_next/image") || url.startsWith("/images/")) {
    return url;
  }

  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
};

const slugifyHeroName = (name: string) =>
  encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, "-"));

async function fetchAllRecords<T>(tableName: string) {
  const records: AirtableListResponse<T>["records"] = [];
  let offset: string | undefined;

  do {
    const query = offset ? `${tableName}?offset=${offset}` : tableName;
    const data = await airtableFetch<AirtableListResponse<T>>(query);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

const getTypeImageMap = cache(async () => {
  const typeRecords = await fetchAllRecords<Record<string, unknown>>("Type");
  const typeImageMap: Record<string, string> = {};

  for (const record of typeRecords) {
    const name = pick(record.fields, ["Name"]);
    const image = pickAttachmentUrl(record.fields, ["Attachments"]);
    if (typeof name === "string" && image) {
      typeImageMap[name] = image;
    }
  }

  return typeImageMap;
});

const getEffectsMap = cache(async () => {
  const records = await fetchAllRecords<Record<string, unknown>>("Effects");
  const effectMap: Record<string, Effect> = {};

  for (const record of records) {
    const fields = record.fields || {};
    const effectType = fields.effectType;
    effectMap[record.id] = {
      id: record.id,
      name: String(fields.Name || ""),
      description:
        typeof fields.desc === "object" && fields.desc
          ? String((fields.desc as { value?: string }).value || "")
          : String(fields.desc || ""),
      effectType: Array.isArray(effectType) ? String(effectType[0] || "") : (effectType as string | null) || null,
      hasVariable: Boolean(fields.hasVariable),
      icon: pickAttachmentUrl(fields, ["icon"]),
      fulltime: Boolean(fields.fulltime),
    };
  }

  return effectMap;
});

const getSkillsMap = cache(async () => {
  const [records, effectsMap] = await Promise.all([
    fetchAllRecords<Record<string, unknown>>("Skills"),
    getEffectsMap(),
  ]);

  const skillsMap: Record<string, Skill> = {};

  for (const record of records) {
    const fields = record.fields || {};
    const effectIds = (fields.Effect || fields.effect || fields.effects || []) as string[];
    skillsMap[record.id] = {
      type: String(fields.type || fields.Type || ""),
      name: String(fields.Name || ""),
      description: String(fields.desc || ""),
      image: pickAttachmentUrl(fields, ["image"]),
      cooltime: (fields.cooltime || fields.Cooltime || fields.coolTime || fields.cool_time || null) as
        | string
        | number
        | null,
      effects: effectIds.map((effectId) => effectsMap[effectId]).filter(Boolean),
    };
  }

  return skillsMap;
});

function parseHistory(historyRaw: unknown) {
  if (!historyRaw || typeof historyRaw !== "string") {
    return [] as Array<{ date: string; content: string }>;
  }

  try {
    const parsed = JSON.parse(historyRaw.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => ({
        date: String(entry.date || ""),
        content: String(entry.content || ""),
      }));
    }
  } catch {}

  const lines = historyRaw.split("\n").map((line) => line.trim()).filter(Boolean);
  const output: Array<{ date: string; content: string }> = [];
  const datePattern = /^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/;

  for (let index = 0; index < lines.length; index += 1) {
    if (datePattern.test(lines[index])) {
      output.push({
        date: lines[index],
        content: lines[index + 1] || "",
      });
      index += 1;
    }
  }

  return output;
}

function buildHeroSummary(
  record: { id: string; fields: Record<string, unknown> },
  typeImageMap: Record<string, string>,
  skillsMap: Record<string, Skill>,
): HeroSummary {
  const fields = record.fields || {};
  const typeName = String(pick(fields, ["type", "Type"]) || "");
  const passiveIds = ((fields.passive || fields.Passive || []) as string[]) || [];
  const passiveSkills = passiveIds.map((id) => skillsMap[id]).filter(Boolean);
  const name = String(pick(fields, ["Name"]) || "");

  return {
    id: record.id,
    name,
    slug: slugifyHeroName(name),
    nickname: (pick(fields, ["nickname"]) as string | null) || null,
    rarity: String(pick(fields, ["rarity", "Rarity"]) || ""),
    type: typeName,
    group: String(pick(fields, ["group"]) || ""),
    hasEffect: Boolean(fields.hasEffect),
    portrait: pickAttachmentUrl(fields, ["portrait", "Portrait", "초상", "이미지"]) || "",
    typeImage: typeImageMap[typeName] || null,
    skills: passiveSkills,
  };
}

export const getHeroes = cache(async (): Promise<HeroSummary[]> => {
  if (!hasAirtableConfig) {
    return [];
  }

  const [heroRecords, typeImageMap, skillsMap] = await Promise.all([
    airtableFetch<AirtableListResponse<Record<string, unknown>>>(
      "Heroes?sort[0][field]=Name&sort[0][direction]=asc",
    ),
    getTypeImageMap(),
    getSkillsMap(),
  ]);

  return heroRecords.records.map((record) => buildHeroSummary(record, typeImageMap, skillsMap));
});

export const getEffects = cache(async (): Promise<Effect[]> => {
  if (!hasAirtableConfig) {
    return [];
  }

  const effectMap = await getEffectsMap();
  return Object.values(effectMap);
});

export async function getHeroByName(name: string): Promise<HeroDetail | null> {
  if (!hasAirtableConfig) {
    return null;
  }

  const encodedName = name.replace(/'/g, "\\'");
  const heroList = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `Heroes?filterByFormula=({Name}='${encodedName}')`,
  );
  const record = heroList.records[0];
  if (!record) {
    return null;
  }

  return getHeroById(record.id);
}

export async function getHeroBySlug(slug: string): Promise<HeroDetail | null> {
  const heroes = await getHeroes();
  const matched = heroes.find((hero) => hero.slug === slug);
  if (!matched) {
    return null;
  }

  return getHeroById(matched.id);
}

export async function getHeroById(id: string): Promise<HeroDetail | null> {
  if (!hasAirtableConfig) {
    return null;
  }

  const [heroData, typeImageMap, skillsMap] = await Promise.all([
    airtableFetch<{ id: string; fields: Record<string, unknown> }>(`Heroes/${id}`),
    getTypeImageMap(),
    getSkillsMap(),
  ]);

  if (!heroData?.id) {
    return null;
  }

  const fields = heroData.fields || {};
  const summary = buildHeroSummary(heroData, typeImageMap, skillsMap);

  const getSkillData = (ids: unknown) => {
    const [skillId] = ((ids as string[]) || []);
    return skillId ? skillsMap[skillId] || null : null;
  };

  return {
    ...summary,
    portrait: optimizeImageUrl(summary.portrait, 640, 85),
    typeImage: summary.typeImage ? optimizeImageUrl(summary.typeImage, 64, 90) : null,
    atk: (pick(fields, ["atk", "공격력"]) as string | number | null) || null,
    def: (pick(fields, ["def", "방어력"]) as string | number | null) || null,
    hp: (pick(fields, ["hp", "생명력"]) as string | number | null) || null,
    spd: (pick(fields, ["spd", "속공"]) as string | number | null) || null,
    crit_rate: (pick(fields, ["crit_rate", "치명타 확률(%)"]) as string | number | null) || null,
    crit_dmg: (pick(fields, ["crit_dmg", "치명타 피해(%)"]) as string | number | null) || null,
    weak_rate: (pick(fields, ["weak_rate", "약점 공격 확률(%)"]) as string | number | null) || null,
    block_rate: (pick(fields, ["block_rate", "막기 확률(%)"]) as string | number | null) || null,
    dmg_reduce: (pick(fields, ["dmg_reduce", "받는 피해 감소(%)"]) as string | number | null) || null,
    eff_hit: (pick(fields, ["eff_hit", "효과 적중(%)"]) as string | number | null) || null,
    eff_res: (pick(fields, ["eff_res", "효과 저항(%)"]) as string | number | null) || null,
    attack: getSkillData(fields.attack || fields.Attack),
    passive: getSkillData(fields.passive || fields.Passive),
    active_1: getSkillData(fields.active_1 || fields.Active_1 || fields.active1 || fields.Active1),
    active_2: getSkillData(fields.active_2 || fields.Active_2 || fields.active2 || fields.Active2),
    description: (pick(fields, ["Description", "description"]) as string | null) || null,
    history: parseHistory(pick(fields, ["history", "History", "updateHistory", "UpdateHistory", "업데이트 히스토리", "히스토리"])),
    transLevel: (pick(fields, ["transLevel", "TransLevel", "초월", "초월레벨"]) as string | number | null) || null,
  };
}

export async function getComments(heroId: string): Promise<CommentRecord[]> {
  if (!hasAirtableConfig) {
    return [];
  }

  const encodedHeroId = heroId.replace(/'/g, "\\'");
  const data = await airtableFetch<AirtableListResponse<Record<string, unknown>>>(
    `${COMMENTS_TABLE}?filterByFormula={heroId}='${encodedHeroId}'`,
  );

  return (data.records || []).map((record) => ({
    id: record.id,
    nickname: String(record.fields.nickname || "익명"),
    content: String(record.fields.content || ""),
    timestamp: record.createdTime || String(record.fields.timestamp || ""),
  }));
}

export async function createComment(heroId: string, nickname: string, content: string) {
  if (!hasAirtableConfig) {
    throw new Error("AIRTABLE_TOKEN is not configured.");
  }

  return airtableFetch(`${COMMENTS_TABLE}`, {
    method: "POST",
    body: JSON.stringify({
      fields: {
        heroId,
        nickname,
        content,
      },
    }),
  });
}
