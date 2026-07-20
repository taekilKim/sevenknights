import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

const catalogPath = path.join(process.cwd(), "content", "hero-catalog.json");
const skillTypeMap: Record<string, "attack" | "passive" | "active"> = {
  Attack: "attack",
  "기본공격": "attack",
  Passive: "passive",
  "패시브": "passive",
  Active: "active",
  "액티브": "active",
};

function isAuthorized(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken && process.env.NODE_ENV !== "production") {
    return true;
  }

  const header = request.headers.get("authorization") || "";
  return Boolean(adminToken) && header === `Bearer ${adminToken}`;
}

export async function PUT(request: Request, { params }: Params) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const heroId = decodeURIComponent(id);
    const nextHero = await request.json();

    if (!nextHero?.id || nextHero.id !== heroId) {
      return NextResponse.json(
        { error: "요청 경로의 영웅 id와 JSON id가 일치해야 합니다." },
        { status: 400 },
      );
    }

    const raw = await fs.readFile(catalogPath, "utf8");
    const catalog = JSON.parse(raw) as { heroes: Array<{ id: string; name?: string }>; effects: unknown[] };
    const heroIndex = catalog.heroes.findIndex((hero) => hero.id === heroId);

    if (heroIndex < 0) {
      return NextResponse.json(
        { error: "해당 영웅을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (Array.isArray(nextHero.skillList)) {
      const attack = nextHero.skillList.find((skill: { type?: string }) => skillTypeMap[skill.type || ""] === "attack") || null;
      const passive = nextHero.skillList.find((skill: { type?: string }) => skillTypeMap[skill.type || ""] === "passive") || null;
      const activeSkills = nextHero.skillList.filter((skill: { type?: string }) => skillTypeMap[skill.type || ""] === "active");

      nextHero.attack = attack;
      nextHero.passive = passive;
      nextHero.active_1 = activeSkills[0] || null;
      nextHero.active_2 = activeSkills[1] || null;
    }

    catalog.heroes[heroIndex] = nextHero;
    await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

    return NextResponse.json({ ok: true, hero: nextHero });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "영웅 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
