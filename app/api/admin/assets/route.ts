import { promises as fs } from "fs";
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

function safeFilename(file: File) {
  const extension = extensionFor(file);
  const basename = path
    .basename(file.name, path.extname(file.name))
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${basename || "image"}-${Date.now()}${extension}`;
}

async function commitToGithub(repoPath: string, content: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || "taekilKim/sevenknights";
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token) {
    throw new Error("운영 업로드에는 GITHUB_TOKEN 환경변수가 필요합니다.");
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${repoPath}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      branch,
      message: `Upload admin asset ${path.basename(repoPath)}`,
      content,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "GitHub에 이미지를 업로드하지 못했습니다.");
  }
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

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "이미지는 2MB 이하만 업로드할 수 있습니다." }, { status: 400 });
    }

    const filename = safeFilename(file);
    const repoPath = `public/content/${folder}/${filename}`;
    const publicPath = `/content/${folder}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (process.env.GITHUB_TOKEN) {
      await commitToGithub(repoPath, buffer.toString("base64"));
    } else if (process.env.NODE_ENV !== "production") {
      const targetPath = path.join(process.cwd(), repoPath);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, buffer);
    } else {
      throw new Error("운영 업로드에는 GITHUB_TOKEN 환경변수가 필요합니다.");
    }

    return NextResponse.json({ ok: true, url: publicPath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "이미지 업로드에 실패했습니다." },
      { status: 500 },
    );
  }
}
