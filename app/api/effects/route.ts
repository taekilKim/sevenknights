import { NextResponse } from "next/server";

import { getEffects } from "@/lib/catalog";

export async function GET() {
  try {
    const effects = await getEffects();
    return NextResponse.json(effects, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch effects" },
      { status: 500 },
    );
  }
}
