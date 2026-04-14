import { NextResponse } from "next/server";

import { getHeroByName } from "@/lib/airtable";

type Props = {
  params: Promise<{ name: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { name } = await params;

  try {
    const hero = await getHeroByName(decodeURIComponent(name));
    if (!hero) {
      return NextResponse.json({ error: "영웅을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(hero, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch hero by name" },
      { status: 500 },
    );
  }
}
