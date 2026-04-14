import { NextResponse } from "next/server";

import { getHeroes } from "@/lib/airtable";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");
    const type = searchParams.get("type");

    const heroes = await getHeroes();
    const filtered = heroes.filter((hero) => {
      const groupMatches = !group || hero.group === group;
      const typeMatches = !type || hero.type === type;
      return groupMatches && typeMatches;
    });

    return NextResponse.json(filtered, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch heroes" },
      { status: 500 },
    );
  }
}
