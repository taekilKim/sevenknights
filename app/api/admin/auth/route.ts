import { NextResponse } from "next/server";

function isAuthorized(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken && process.env.NODE_ENV !== "production") {
    return true;
  }

  const header = request.headers.get("authorization") || "";
  return Boolean(adminToken) && header === `Bearer ${adminToken}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "어드민 토큰이 일치하지 않습니다." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
