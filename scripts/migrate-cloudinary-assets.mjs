import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const catalogPath = path.join(root, "content/hero-catalog.json");
const publicContentDir = path.join(root, "public/content");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const args = new Set(process.argv.slice(2));

function optionValue(name, fallback) {
  const prefix = `${name}=`;
  const matched = [...args].find((arg) => arg.startsWith(prefix));
  return matched ? matched.slice(prefix.length) : fallback;
}

async function loadEnvFile(filePath) {
  const text = await fs.readFile(filePath, "utf8").catch(() => "");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index < 0) continue;

    const key = trimmed.slice(0, index);
    const rawValue = trimmed.slice(index + 1);
    process.env[key] ||= rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function requiredEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} 환경변수가 필요합니다.`);
  return value;
}

function basicAuthHeader() {
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

async function cloudinaryAdmin(pathname, init = {}) {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}${pathname}`, {
    ...init,
    headers: {
      Authorization: basicAuthHeader(),
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Cloudinary Admin API 요청 실패: ${pathname}`);
  }

  return payload;
}

function uploadSignature(params) {
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const payload = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function listAllCloudinaryImages() {
  const resources = [];
  let nextCursor = "";

  do {
    const query = new URLSearchParams({ max_results: "500" });
    if (nextCursor) query.set("next_cursor", nextCursor);

    const payload = await cloudinaryAdmin(`/resources/image/upload?${query.toString()}`);
    resources.push(...(payload.resources || []));
    nextCursor = payload.next_cursor || "";
  } while (nextCursor);

  return resources;
}

async function destroyCloudinaryImage(publicId) {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    invalidate: "true",
    public_id: publicId,
    timestamp,
  };
  const form = new FormData();
  form.append("api_key", apiKey);
  form.append("public_id", publicId);
  form.append("timestamp", timestamp);
  form.append("invalidate", "true");
  form.append("signature", uploadSignature(params));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || `${publicId} 삭제 실패`);
  }

  return payload;
}

async function clearCloudinaryImages(deleteMode) {
  const resources = await listAllCloudinaryImages();
  const targets = resources.filter((resource) => {
    if (deleteMode === "all") return true;
    if (deleteMode === "outside-senadb") return !String(resource.public_id || "").startsWith("senadb/");
    return false;
  });

  console.log(`Cloudinary 기존 이미지 ${resources.length}개 중 ${targets.length}개를 삭제합니다. mode=${deleteMode}`);
  if (args.has("--dry-run")) {
    for (const resource of targets.slice(0, 80)) {
      console.log(`삭제 예정: ${resource.public_id}`);
    }
    if (targets.length > 80) console.log(`...외 ${targets.length - 80}개`);
    return 0;
  }

  for (const [index, resource] of targets.entries()) {
    await destroyCloudinaryImage(resource.public_id);
    if ((index + 1) % 20 === 0 || index + 1 === targets.length) {
      console.log(`삭제 진행: ${index + 1}/${targets.length}`);
    }
  }

  return targets.length;
}

function contentFolderFor(relativePublicPath) {
  const parts = relativePublicPath.split("/");
  return parts[2] || "misc";
}

function publicIdFor(relativePublicPath) {
  const parsed = path.posix.parse(relativePublicPath);
  const folder = contentFolderFor(relativePublicPath);
  const basename = parsed.name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `senadb/${folder}/${basename || `asset-${Date.now()}`}`;
}

function mimeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function uploadLocalImage(relativePublicPath) {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const absolutePath = path.join(root, "public", relativePublicPath.replace(/^\//, ""));
  const buffer = await fs.readFile(absolutePath);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = publicIdFor(relativePublicPath);
  const folder = path.posix.dirname(publicId);
  const params = {
    folder,
    overwrite: "true",
    public_id: path.posix.basename(publicId),
    timestamp,
  };
  const form = new FormData();
  const blob = new Blob([buffer], { type: mimeFor(absolutePath) });

  form.append("file", blob, path.basename(absolutePath));
  form.append("api_key", apiKey);
  form.append("folder", folder);
  form.append("overwrite", "true");
  form.append("public_id", path.posix.basename(publicId));
  form.append("timestamp", timestamp);
  form.append("signature", uploadSignature(params));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || `${relativePublicPath} 업로드 실패`);
  }

  if (!payload?.secure_url) {
    throw new Error(`${relativePublicPath} 업로드 응답에 URL이 없습니다.`);
  }

  return String(payload.secure_url);
}

async function collectLocalContentImages() {
  const paths = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!imageExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      paths.push(`/${path.relative(path.join(root, "public"), fullPath).split(path.sep).join("/")}`);
    }
  }

  await walk(publicContentDir);
  return paths.sort((left, right) => left.localeCompare(right));
}

function replaceCatalogImageRefs(catalog, urlMap) {
  let replaced = 0;

  function visit(value) {
    if (Array.isArray(value)) return value.map(visit);

    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) value[key] = visit(value[key]);
      return value;
    }

    if (typeof value === "string" && urlMap.has(value)) {
      replaced += 1;
      return urlMap.get(value);
    }

    return value;
  }

  return { catalog: visit(catalog), replaced };
}

async function main() {
  await loadEnvFile(envPath);

  const deleteMode = optionValue("--delete-existing", "none");
  if (!["none", "outside-senadb", "all"].includes(deleteMode)) {
    throw new Error("--delete-existing 값은 none, outside-senadb, all 중 하나여야 합니다.");
  }

  const deleted = await clearCloudinaryImages(deleteMode);
  if (args.has("--dry-run")) {
    console.log("dry-run이므로 업로드와 JSON 교체는 실행하지 않았습니다.");
    return;
  }

  const localImages = await collectLocalContentImages();
  const urlMap = new Map();

  console.log(`로컬 콘텐츠 이미지 ${localImages.length}개를 Cloudinary로 업로드합니다.`);

  for (const [index, relativePath] of localImages.entries()) {
    const url = await uploadLocalImage(relativePath);
    urlMap.set(relativePath, url);

    if ((index + 1) % 25 === 0 || index + 1 === localImages.length) {
      console.log(`업로드 진행: ${index + 1}/${localImages.length}`);
    }
  }

  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const result = replaceCatalogImageRefs(catalog, urlMap);
  result.catalog.generatedAt = new Date().toISOString();
  await fs.writeFile(catalogPath, `${JSON.stringify(result.catalog, null, 2)}\n`);

  console.log(`완료: Cloudinary 삭제 ${deleted}개, 업로드 ${urlMap.size}개, JSON 참조 교체 ${result.replaced}개`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
