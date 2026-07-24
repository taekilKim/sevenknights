import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { readCatalogFile, writeCatalogFile } from "@/lib/admin-catalog";
import type { Effect } from "@/lib/types";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  try {
    const effect = await request.json() as Effect;

    if (!effect?.id || !effect.name) {
      return NextResponse.json({ error: "효과 id와 이름은 반드시 필요합니다." }, { status: 400 });
    }

    const catalog = await readCatalogFile<{ heroes: unknown[]; effects: Effect[] }>();

    if (catalog.effects.some((entry) => entry.id === effect.id)) {
      return NextResponse.json({ error: "이미 존재하는 효과 id입니다." }, { status: 409 });
    }

    catalog.effects = [...catalog.effects, effect].sort((left, right) => left.name.localeCompare(right.name, "ko"));
    await writeCatalogFile(catalog, `Add effect ${effect.name}`);

    return NextResponse.json({ ok: true, effect });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "효과 추가에 실패했습니다." },
      { status: 500 },
    );
  }
}
