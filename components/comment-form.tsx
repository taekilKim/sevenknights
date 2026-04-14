"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  heroId: string;
};

export function CommentForm({ heroId }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!nickname.trim() || !content.trim()) {
      setError("닉네임과 내용을 모두 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/comments/${encodeURIComponent(heroId)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nickname: nickname.trim(),
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "댓글 등록에 실패했습니다.");
        }

        setNickname("");
        setContent("");
        setSuccess("댓글이 등록되었습니다.");
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "댓글 등록 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <form className="comment-form" onSubmit={onSubmit}>
      <div>
        <label htmlFor="nickname">닉네임</label>
        <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={30} />
      </div>
      <div>
        <label htmlFor="content">내용</label>
        <textarea id="content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} />
      </div>
      {error ? <div className="muted" style={{ color: "#dc2626" }}>{error}</div> : null}
      {success ? <div className="muted" style={{ color: "#2563eb" }}>{success}</div> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "등록 중..." : "의견 남기기"}
      </button>
    </form>
  );
}
