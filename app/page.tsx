import type { Metadata } from "next";

import { HomePage as HomePageContent } from "@/components/home-page";

export const metadata: Metadata = {
  title: "세나DB | 세븐나이츠 리버스 공략 허브",
  description: "세븐나이츠 리버스 결투장 덱 추천, 티어표, 초보자 가이드, 영웅 도감을 빠르게 확인하세요.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomePageContent />;
}
