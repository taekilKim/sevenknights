import { NextResponse } from "next/server";

import { getHeroById } from "@/lib/airtable";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;

  try {
    const hero = await getHeroById(id);
    if (!hero) {
      return NextResponse.json({ error: "Hero not found" }, { status: 404 });
    }

    return NextResponse.json(hero, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch hero details" },
      { status: 500 },
    );
  }
}
