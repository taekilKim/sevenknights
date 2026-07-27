import crypto from "crypto";

import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/admin-auth";

const gaScope = "https://www.googleapis.com/auth/analytics.readonly";

type GaRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

function base64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function envValue(...keys: string[]) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return "";
}

function privateKey() {
  const value = envValue("GA_PRIVATE_KEY", "GOOGLE_PRIVATE_KEY");
  return value.replace(/\\n/g, "\n");
}

function analyticsConfig() {
  return {
    propertyId: envValue("GA_PROPERTY_ID", "GA4_PROPERTY_ID", "GOOGLE_ANALYTICS_PROPERTY_ID"),
    clientEmail: envValue("GA_CLIENT_EMAIL", "GOOGLE_CLIENT_EMAIL"),
    privateKey: privateKey(),
  };
}

async function getAccessToken(clientEmail: string, key: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: gaScope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const unsignedToken = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsignedToken).sign(key, "base64url");
  const assertion = `${unsignedToken}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || "Google Analytics 인증에 실패했습니다.");
  }

  return String(payload.access_token);
}

async function runGaReport(accessToken: string, propertyId: string, body: unknown) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Google Analytics 데이터를 가져오지 못했습니다.");
  }

  return payload as { rows?: GaRow[]; totals?: GaRow[] };
}

function numberValue(row: GaRow | undefined, index: number) {
  return Number(row?.metricValues?.[index]?.value || 0);
}

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN이 없거나 일치하지 않습니다." },
      { status: 401 },
    );
  }

  const config = analyticsConfig();

  if (!config.propertyId || !config.clientEmail || !config.privateKey) {
    return NextResponse.json({
      ok: false,
      setupRequired: true,
      missing: [
        !config.propertyId ? "GA_PROPERTY_ID" : "",
        !config.clientEmail ? "GA_CLIENT_EMAIL" : "",
        !config.privateKey ? "GA_PRIVATE_KEY" : "",
      ].filter(Boolean),
    });
  }

  try {
    const accessToken = await getAccessToken(config.clientEmail, config.privateKey);
    const [overview, pages, sources] = await Promise.all([
      runGaReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
      }),
      runGaReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      runGaReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),
    ]);
    const total = overview.totals?.[0] || overview.rows?.[0];

    return NextResponse.json({
      ok: true,
      range: "최근 28일",
      overview: {
        activeUsers: numberValue(total, 0),
        sessions: numberValue(total, 1),
        pageViews: numberValue(total, 2),
      },
      pages: (pages.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || "-",
        pageViews: numberValue(row, 0),
        activeUsers: numberValue(row, 1),
      })),
      sources: (sources.rows || []).map((row) => ({
        source: row.dimensionValues?.[0]?.value || "-",
        sessions: numberValue(row, 0),
        activeUsers: numberValue(row, 1),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "유입 데이터를 가져오지 못했습니다." },
      { status: 500 },
    );
  }
}
