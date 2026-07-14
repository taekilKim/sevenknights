import fs from "node:fs/promises";
import path from "node:path";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "app6CjXEVBGVvatUd";

if (!AIRTABLE_TOKEN) {
  console.error("AIRTABLE_TOKEN is required to migrate Airtable assets.");
  process.exit(1);
}

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public", "content");
const manifestPath = path.join(rootDir, "content", "asset-manifest.json");

function slugify(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-가-힣]/g, "");
}

async function airtableFetch(pathname) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${pathname}`, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable request failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function fetchAllRecords(tableName) {
  const records = [];
  let offset;

  do {
    const query = offset ? `${tableName}?offset=${offset}` : tableName;
    const data = await airtableFetch(query);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status} ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destination, Buffer.from(arrayBuffer));
}

function getFirstAttachment(fields, keys) {
  for (const key of keys) {
    const value = fields?.[key];
    if (Array.isArray(value) && value[0]) {
      return value[0];
    }
  }
  return null;
}

function extensionFromAttachment(attachment) {
  const filename = attachment?.filename || "";
  const ext = path.extname(filename);
  return ext || ".png";
}

async function main() {
  const manifest = {
    heroes: {},
    types: {},
    skills: {},
    effects: {},
  };

  await Promise.all([
    ensureDir(path.join(publicDir, "heroes")),
    ensureDir(path.join(publicDir, "types")),
    ensureDir(path.join(publicDir, "skills")),
    ensureDir(path.join(publicDir, "effects")),
  ]);

  const [heroes, types, skills, effects] = await Promise.all([
    fetchAllRecords("Heroes"),
    fetchAllRecords("Type"),
    fetchAllRecords("Skills"),
    fetchAllRecords("Effects"),
  ]);

  for (const record of heroes) {
    const fields = record.fields || {};
    const attachment = getFirstAttachment(fields, ["portrait", "Portrait", "초상", "이미지"]);
    if (!attachment?.url) continue;

    const slug = slugify(String(fields.Name || record.id));
    const ext = extensionFromAttachment(attachment);
    const filename = `${slug}${ext}`;
    const relativePath = `/content/heroes/${filename}`;
    const targetPath = path.join(publicDir, "heroes", filename);
    await downloadFile(attachment.url, targetPath);
    manifest.heroes[record.id] = relativePath;
    manifest.heroes[slug] = relativePath;
    console.log(`Downloaded hero asset: ${fields.Name || record.id}`);
  }

  for (const record of types) {
    const fields = record.fields || {};
    const attachment = getFirstAttachment(fields, ["Attachments"]);
    if (!attachment?.url) continue;

    const key = slugify(String(fields.Name || record.id));
    const ext = extensionFromAttachment(attachment);
    const filename = `${key}${ext}`;
    const relativePath = `/content/types/${filename}`;
    const targetPath = path.join(publicDir, "types", filename);
    await downloadFile(attachment.url, targetPath);
    manifest.types[String(fields.Name || record.id)] = relativePath;
    manifest.types[key] = relativePath;
    console.log(`Downloaded type asset: ${fields.Name || record.id}`);
  }

  for (const record of skills) {
    const fields = record.fields || {};
    const attachment = getFirstAttachment(fields, ["image"]);
    if (!attachment?.url) continue;

    const ext = extensionFromAttachment(attachment);
    const filename = `${record.id}${ext}`;
    const relativePath = `/content/skills/${filename}`;
    const targetPath = path.join(publicDir, "skills", filename);
    await downloadFile(attachment.url, targetPath);
    manifest.skills[record.id] = relativePath;
    console.log(`Downloaded skill asset: ${fields.Name || record.id}`);
  }

  for (const record of effects) {
    const fields = record.fields || {};
    const attachment = getFirstAttachment(fields, ["icon"]);
    if (!attachment?.url) continue;

    const ext = extensionFromAttachment(attachment);
    const filename = `${record.id}${ext}`;
    const relativePath = `/content/effects/${filename}`;
    const targetPath = path.join(publicDir, "effects", filename);
    await downloadFile(attachment.url, targetPath);
    manifest.effects[record.id] = relativePath;
    console.log(`Downloaded effect asset: ${fields.Name || record.id}`);
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote manifest to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
