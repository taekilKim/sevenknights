import type { Metadata } from "next";

import { HeroCatalogPage } from "@/components/hero-catalog-page";

export const metadata: Metadata = {
  title: "영웅 도감",
  description: "세븐나이츠 리버스 모든 영웅의 희귀도, 타입, 스킬 정보를 필터와 검색으로 확인하세요.",
};

export default function HeroesPage() {
  return <HeroCatalogPage />;
}
