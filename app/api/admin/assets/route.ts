import crypto from "crypto";
import path from "path";

import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

const allowedFolders = new Set(["heroes", "skills", "types", "effects"]);
const maxFileSize = 2 * 1024 * 1024;

function extensionFor(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(extension)) return extension;

  if (file.type === "image/png") return ".png";
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type === "image/svg+xml") return ".svg";
  return "";
}

function safePublicId(file: File) {
  const basename = path
    .basename(file.name, path.extname(file.name))
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${basename || "image"}-${Date.now()}`;
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function uploadToCloudinary(file: File, folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary 환경변수(CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)가 필요합니다.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uploadFolder = `senadb/${folder}`;
  const publicId = safePublicId(file);
  const params = {
    folder: uploadFolder,
    public_id: publicId,
    timestamp,
  };
  const signature = signCloudinaryParams(params, apiSecret);
  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", apiKey);
  uploadForm.append("folder", uploadFolder);
  uploadForm.append("public_id", publicId);
  uploadForm.append("timestamp", timestamp);
  uploadForm.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: uploadForm,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Cloudinary에 이미지를 업로드하지 못했습니다.");
  }

  if (!payload?.secure_url) {
    throw new Error("Cloudinary 업로드 응답에 이미지 URL이 없습니다.");
  }

  return {
    url: String(payload.secure_url),
    publicId: String(payload.public_id || `${uploadFolder}/${publicId}`),
  };
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "업로드할 이미지 파일이 필요합니다." }, { status: 400 });
    }

    if (!allowedFolders.has(folder)) {
      return NextResponse.json({ error: "업로드 폴더가 올바르지 않습니다." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    if (!extensionFor(file)) {
      return NextResponse.json({ error: "png, jpg, webp, gif, svg 이미지만 업로드할 수 있습니다." }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "이미지는 2MB 이하만 업로드할 수 있습니다." }, { status: 400 });
    }

    const result = await uploadToCloudinary(file, folder);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "이미지 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
