import Script from "next/script";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;

export function GoogleAdSense() {
  if (!clientId) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
