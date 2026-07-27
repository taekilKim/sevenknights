import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { readCatalogFile, writeCatalogFile } from "@/lib/admin-catalog";
import type { HeroDetail } from "@/lib/types";

type AdminHero = Omit<HeroDetail, "skills">;

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  try {
    const hero = await request.json() as AdminHero;

    if (!hero?.id || !hero.name || !hero.slug) {
      return NextResponse.json({ error: "영웅 id, slug, 이름은 반드시 필요합니다." }, { status: 400 });
    }

    const catalog = await readCatalogFile<{ heroes: AdminHero[]; effects: unknown[] }>();

    if (catalog.heroes.some((entry) => entry.id === hero.id || entry.slug === hero.slug)) {
      return NextResponse.json({ error: "이미 존재하는 영웅 id 또는 slug입니다." }, { status: 409 });
    }

    catalog.heroes = [...catalog.heroes, hero].sort((left, right) => left.name.localeCompare(right.name, "ko"));
    await writeCatalogFile(catalog, `Add hero ${hero.name}`);

    return NextResponse.json({ ok: true, hero });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "영웅 추가에 실패했습니다." },
      { status: 500 },
    );
  }
}
