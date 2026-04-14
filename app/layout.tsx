import type { Metadata } from "next";
import Link from "next/link";

import { GoogleAdSense } from "@/components/google-adsense";
import { SiteNav } from "@/components/site-nav";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://senadb.games"),
  title: {
    default: "세나DB | 세븐나이츠 리버스 도감 & 공략",
    template: "%s | 세나DB",
  },
  description:
    "세븐나이츠 리버스 영웅 도감, 티어표, 덱 빌더, 초보자 가이드를 한곳에서 확인하는 공략 허브.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <GoogleAdSense />
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand" aria-label="세나DB 홈">
                <span className="brand-mark" aria-hidden="true" />
                <span className="brand-copy">
                  <span className="brand-title">세나DB</span>
                  <span className="brand-subtitle">Seven Knights Re:Birth Guide</span>
                </span>
              </Link>
              <SiteNav />
            </div>
          </header>
          <main className="page-wrap">{children}</main>
        </div>
      </body>
    </html>
  );
}
