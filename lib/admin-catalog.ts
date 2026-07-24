import { promises as fs } from "fs";
import path from "path";

const catalogPath = path.join(process.cwd(), "content", "hero-catalog.json");
const catalogRepoPath = "content/hero-catalog.json";

async function commitFileToGithub(repoPath: string, content: string, message: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || "taekilKim/sevenknights";
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token) {
    throw new Error("운영 저장에는 GITHUB_TOKEN 환경변수가 필요합니다.");
  }

  const currentResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${repoPath}?ref=${branch}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const current = await currentResponse.json().catch(() => null);

  if (!currentResponse.ok || !current?.sha) {
    throw new Error(current?.message || "GitHub에서 현재 파일 정보를 가져오지 못했습니다.");
  }

  const updateResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${repoPath}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      branch,
      message,
      content: Buffer.from(content).toString("base64"),
      sha: current.sha,
    }),
  });

  if (!updateResponse.ok) {
    const payload = await updateResponse.json().catch(() => null);
    throw new Error(payload?.message || "GitHub에 파일을 저장하지 못했습니다.");
  }
}

export async function readCatalogFile<T>() {
  const raw = await fs.readFile(catalogPath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeCatalogFile(catalog: unknown, message: string) {
  const content = `${JSON.stringify(catalog, null, 2)}\n`;

  if (process.env.GITHUB_TOKEN) {
    await commitFileToGithub(catalogRepoPath, content, message);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("운영 저장에는 GITHUB_TOKEN 환경변수가 필요합니다.");
  }

  await fs.writeFile(catalogPath, content);
}
