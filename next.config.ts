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
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/heroes.html",
        destination: "/heroes",
        permanent: true,
      },
      {
        source: "/deck.html",
        destination: "/guides/arena-decks",
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
  async rewrites() {
    return [
      {
        source: "/index.html",
        destination: "/",
      },
    ];
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
