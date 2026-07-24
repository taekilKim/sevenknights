import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { readCatalogFile, writeCatalogFile } from "@/lib/admin-catalog";
import type { Effect } from "@/lib/types";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const effectId = decodeURIComponent(id);
    const nextEffect = await request.json() as Effect;

    if (!nextEffect?.id || nextEffect.id !== effectId) {
      return NextResponse.json({ error: "요청 경로의 효과 id와 JSON id가 일치해야 합니다." }, { status: 400 });
    }

    const catalog = await readCatalogFile<{ heroes: unknown[]; effects: Effect[] }>();
    const index = catalog.effects.findIndex((effect) => effect.id === effectId);

    if (index < 0) {
      return NextResponse.json({ error: "해당 효과를 찾을 수 없습니다." }, { status: 404 });
    }

    catalog.effects[index] = nextEffect;
    catalog.effects.sort((left, right) => left.name.localeCompare(right.name, "ko"));
    await writeCatalogFile(catalog, `Update effect ${nextEffect.name}`);

    return NextResponse.json({ ok: true, effect: nextEffect });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "효과 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const effectId = decodeURIComponent(id);
    const catalog = await readCatalogFile<{ heroes: unknown[]; effects: Effect[] }>();
    const nextEffects = catalog.effects.filter((effect) => effect.id !== effectId);

    if (nextEffects.length === catalog.effects.length) {
      return NextResponse.json({ error: "해당 효과를 찾을 수 없습니다." }, { status: 404 });
    }

    catalog.effects = nextEffects;
    await writeCatalogFile(catalog, `Delete effect ${effectId}`);

    return NextResponse.json({ ok: true, id: effectId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "효과 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
