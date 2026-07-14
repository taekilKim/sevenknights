import fs from "node:fs/promises";
import path from "node:path";

const sourceDir = process.argv[2];

if (!sourceDir) {
  console.error("Usage: npm run build:catalog -- <airtable-csv-directory>");
  process.exit(1);
}

const rootDir = process.cwd();
const outputPath = path.join(rootDir, "content", "hero-catalog.json");
const assetManifest = JSON.parse(await fs.readFile(path.join(rootDir, "content", "csv-asset-manifest.json"), "utf8"));

const sources = {
  heroes: "Heroes-Grid view.csv",
  skills: "Skills-Grid view.csv",
  effects: "Effects-Grid view.csv",
  types: "Type-Grid view.csv",
};

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, ""), record[index] || ""])),
  );
}

function attachmentFilename(value) {
  return value.match(/^(.*?)\s*\(https:\/\/[^)]+\)$/s)?.[1].trim() || null;
}

function splitLinks(value) {
  return value ? value.split(/,\s*/).filter(Boolean) : [];
}

function slugify(name) {
  return encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, "-"));
}

function parseHistory(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
    return Array.isArray(parsed)
      ? parsed.map((entry) => ({ date: String(entry.date || ""), content: String(entry.content || "") }))
      : [];
  } catch {
    return [];
  }
}

function assetPath(category, key) {
  return assetManifest[category]?.[key]?.path || null;
}

const readSource = async (source) => parseCsv(await fs.readFile(path.join(sourceDir, source), "utf8"));
const [heroRows, skillRows, effectRows, typeRows] = await Promise.all(
  Object.values(sources).map(readSource),
);

const effectsByName = new Map();
const effects = effectRows.map((row, index) => {
  const filename = attachmentFilename(row.icon);
  const effect = {
    id: `effect-${index + 1}`,
    name: row.Name,
    description: row.desc,
    effectType: row.effectType || null,
    hasVariable: Boolean(row.hasVariable),
    fulltime: Boolean(row.fulltime),
    icon: filename ? assetPath("effects", `${row.Name}:${filename}`) : null,
    linkedSkillNames: splitLinks(row.skill),
  };
  effectsByName.set(row.Name, [...(effectsByName.get(row.Name) || []), effect]);
  return effect;
});

function effectsForSkill(row) {
  return splitLinks(row.Effect).flatMap((effectName) => {
    const candidates = effectsByName.get(effectName) || [];
    return candidates.filter((effect) => effect.linkedSkillNames.includes(row.Name)).map(({ linkedSkillNames, ...effect }) => effect);
  });
}

const skills = skillRows.map((row, index) => {
  const filename = attachmentFilename(row.image);
  return {
    id: `skill-${index + 1}`,
    name: row.Name,
    type: row.type,
    description: row.desc,
    cooltime: row.cooltime || null,
    image: filename ? assetPath("skills", `${row.type || "Unknown"}:${row.Name}:${filename}`) : null,
    effects: effectsForSkill(row),
    linkedHeroes: {
      attack: splitLinks(row.attack_hero),
      active_1: splitLinks(row.active_1_hero),
      active_2: splitLinks(row.active_2_hero),
      passive: splitLinks(row.passive_hero),
    },
  };
});

function skillForHeroSlot(heroName, slot) {
  const matches = skills.filter((skill) => skill.linkedHeroes[slot].includes(heroName));
  return matches.length === 1 ? matches[0] : null;
}

const typeImages = new Map(
  typeRows.map((row) => {
    const filename = attachmentFilename(row.Attachments);
    return [row.Name, filename ? assetPath("types", `${row.Name}:${filename}`) : null];
  }),
);

const heroes = heroRows.map((row) => {
  const filename = attachmentFilename(row.portrait);
  const slug = slugify(row.Name);
  return {
    id: `hero-${slug}`,
    slug,
    name: row.Name,
    nickname: row.nickname || null,
    group: row.group || "",
    rarity: row.rarity || "",
    type: row.type || "",
    portrait: filename ? assetPath("heroes", `${row.Name}:${filename}`) || "" : "",
    typeImage: typeImages.get(row.type) || null,
    hasEffect: Boolean(row.hasEffect),
    transLevel: row.transLevel || null,
    history: parseHistory(row.history),
    description: null,
    atk: row.atk || null,
    def: row.def || null,
    hp: row.hp || null,
    spd: row.spd || null,
    crit_rate: row.crit_rate || null,
    crit_dmg: row.crit_dmg || null,
    weak_rate: row.weak_rate || null,
    block_rate: row.block_rate || null,
    dmg_reduce: row.dmg_reduce || null,
    eff_hit: row.eff_hit || null,
    eff_res: row.eff_res || null,
    attack: skillForHeroSlot(row.Name, "attack"),
    active_1: skillForHeroSlot(row.Name, "active_1"),
    active_2: skillForHeroSlot(row.Name, "active_2"),
    passive: skillForHeroSlot(row.Name, "passive"),
  };
});

const catalog = {
  generatedAt: new Date().toISOString(),
  heroes,
  effects: effects.map(({ linkedSkillNames, ...effect }) => effect),
  integrity: {
    fullyLinkedHeroes: heroes.filter((hero) => hero.attack && hero.active_1 && hero.active_2 && hero.passive).length,
    partiallyLinkedHeroes: heroes.filter((hero) => hero.attack || hero.active_1 || hero.active_2 || hero.passive).length,
  },
};

await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${heroes.length} heroes and ${effects.length} effects to ${outputPath}`);
console.log(`Fully linked heroes: ${catalog.integrity.fullyLinkedHeroes}`);
console.log(`Partially linked heroes: ${catalog.integrity.partiallyLinkedHeroes}`);
