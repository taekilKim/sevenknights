import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "어드민 토큰이 일치하지 않습니다." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
