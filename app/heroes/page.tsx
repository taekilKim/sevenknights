import type { Metadata } from "next";

import { HeroCatalogPage } from "@/components/hero-catalog-page";

export const metadata: Metadata = {
  title: "도감",
  description: "세븐나이츠 리버스 영웅, 펫, 장비 도감 정보를 확인하세요.",
  alternates: {
    canonical: "/heroes",
  },
};

export default function HeroesPage() {
  return <HeroCatalogPage />;
}
