import { NextResponse } from "next/server";

import { createComment, getComments } from "@/lib/airtable";

type Props = {
  params: Promise<{ heroId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { heroId } = await params;

  try {
    const comments = await getComments(decodeURIComponent(heroId));
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글 불러오기 실패" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Props) {
  const { heroId } = await params;

  try {
    const payload = (await request.json()) as { nickname?: string; content?: string };
    const nickname = payload.nickname?.trim();
    const content = payload.content?.trim();

    if (!nickname || !content) {
      return NextResponse.json({ error: "닉네임과 내용을 모두 입력하세요." }, { status: 400 });
    }

    const record = await createComment(decodeURIComponent(heroId), nickname, content);
    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "댓글 등록 실패" },
      { status: 500 },
    );
  }
}
