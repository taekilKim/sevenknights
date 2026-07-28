import type { Metadata } from "next";

import { DeckBuilder } from "@/components/deck-builder";
import { getHeroes } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "덱 빌더",
  description: "세븐나이츠 리버스 결투장 덱을 직접 편성하고 전열, 후열, 패시브 효과를 확인하세요.",
  alternates: {
    canonical: "/deck-builder",
  },
};

export default async function DeckBuilderPage() {
  const heroes = await getHeroes();

  return <DeckBuilder heroes={heroes} />;
}
