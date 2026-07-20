"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "홈" },
  { href: "/heroes", label: "도감" },
  { href: "/deck-builder", label: "덱 빌더" },
  { href: "/tier-list", label: "티어표" },
  { href: "/guides/beginner", label: "초보자 가이드" },
  { href: "/faq", label: "FAQ" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="top-nav" aria-label="주요 메뉴">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" || pathname === "/index.html" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} data-active={active ? "true" : "false"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
