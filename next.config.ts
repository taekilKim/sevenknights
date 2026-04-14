import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dl.airtable.com",
      },
      {
        protocol: "https",
        hostname: "v5.airtableusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/heroes.html",
        destination: "/heroes",
        permanent: true,
      },
      {
        source: "/deck.html",
        destination: "/deck-builder",
        permanent: true,
      },
      {
        source: "/beginner-guide.html",
        destination: "/guides/beginner",
        permanent: true,
      },
      {
        source: "/faq.html",
        destination: "/faq",
        permanent: true,
      },
      {
        source: "/tier-list.html",
        destination: "/tier-list",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
