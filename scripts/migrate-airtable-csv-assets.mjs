import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const sourceDir = process.argv[2];

if (!sourceDir) {
  console.error("Usage: npm run migrate:csv-assets -- <airtable-csv-directory>");
  process.exit(1);
}

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public", "content");
const manifestPath = path.join(rootDir, "content", "csv-asset-manifest.json");

const sources = [
  { file: "Heroes-Grid view.csv", category: "heroes", imageField: "portrait", nameField: "Name" },
  { file: "Skills-Grid view.csv", category: "skills", imageField: "image", nameField: "Name" },
  { file: "Effects-Grid view.csv", category: "effects", imageField: "icon", nameField: "Name" },
  { file: "Type-Grid view.csv", category: "types", imageField: "Attachments", nameField: "Name" },
];

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

function attachmentFromCell(value) {
  const match = value.match(/^(.*?)\s*\((https:\/\/[^)]+)\)$/s);
  if (!match) {
    return null;
  }

  return { filename: match[1].trim(), url: match[2] };
}

function safeFilename(value) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function assetName(attachment) {
  const ext = path.extname(attachment.filename) || ".png";
  const stem = safeFilename(path.basename(attachment.filename, ext)) || "asset";
  const fingerprint = crypto.createHash("sha256").update(attachment.url).digest("hex").slice(0, 10);
  return `${stem}-${fingerprint}${ext.toLowerCase()}`;
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with ${response.status}`);
  }

  await fs.writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const manifest = { heroes: {}, skills: {}, effects: {}, types: {}, failures: [] };
  const jobs = [];

  for (const source of sources) {
    const csvPath = path.join(sourceDir, source.file);
    const input = await fs.readFile(csvPath, "utf8");
    const records = parseCsv(input);
    const categoryDir = path.join(publicDir, source.category);
    await fs.mkdir(categoryDir, { recursive: true });

    for (const record of records) {
      const attachment = attachmentFromCell(record[source.imageField] || "");
      if (!attachment) {
        continue;
      }

      jobs.push({ attachment, categoryDir, record, source });
    }
  }

  let completed = 0;
  async function runJob(job) {
    const { attachment, categoryDir, record, source } = job;
    const filename = assetName(attachment);
    const relativePath = `/content/${source.category}/${filename}`;
    const destination = path.join(categoryDir, filename);
    const key =
      source.category === "skills"
        ? `${record.type || "Unknown"}:${record[source.nameField]}:${attachment.filename}`
        : `${record[source.nameField]}:${attachment.filename}`;

    try {
      try {
        await fs.access(destination);
      } catch {
        await download(attachment.url, destination);
      }
      manifest[source.category][key] = {
        path: relativePath,
        originalFilename: attachment.filename,
      };
    } catch (error) {
      manifest.failures.push({
        category: source.category,
        name: record[source.nameField],
        filename: attachment.filename,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      completed += 1;
      if (completed % 50 === 0 || completed === jobs.length) {
        console.log(`Processed ${completed}/${jobs.length} assets`);
      }
    }
  }

  const workers = Array.from({ length: 12 }, async () => {
    while (jobs.length > 0) {
      const job = jobs.pop();
      if (job) {
        await runJob(job);
      }
    }
  });
  await Promise.all(workers);

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Saved CSV asset manifest to ${manifestPath}`);
  console.log(`Failures: ${manifest.failures.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
