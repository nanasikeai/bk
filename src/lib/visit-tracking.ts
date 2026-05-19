import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isSecureCookie } from "@/lib/comment-auth";
import { createSignedSession, verifySignedSession } from "@/lib/signed-cookie";
import {
  getShanghaiDayStart,
  getShanghaiMonthStart,
  getShanghaiWeekStart,
} from "@/lib/visit-timezone";

const VISITOR_COOKIE = "visitor-id";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

interface VisitorSession {
  id: string;
}

const KNOWN_SOURCES: Record<string, string> = {
  "google.com": "Google",
  "www.google.com": "Google",
  "bing.com": "Bing",
  "www.bing.com": "Bing",
  "baidu.com": "百度",
  "www.baidu.com": "百度",
  "duckduckgo.com": "DuckDuckGo",
  "github.com": "GitHub",
  "twitter.com": "X (Twitter)",
  "x.com": "X (Twitter)",
  "t.co": "X (Twitter)",
  "weibo.com": "微博",
  "zhihu.com": "知乎",
  "juejin.cn": "掘金",
  "bilibili.com": "哔哩哔哩",
};

const BOT_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|preview|headless/i;

function getSiteHostname() {
  const siteUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch {
    return "localhost";
  }
}

export function isBotUserAgent(userAgent: string | null) {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}

export function shouldSkipVisitPath(path: string) {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/login") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml"
  );
}

export function resolveVisitSource(
  referrer: string | null,
  search: string
): { source: string; referrer: string | null } {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");

  if (utmSource) {
    const parts = [utmSource];
    if (utmMedium) parts.push(utmMedium);
    if (utmCampaign) parts.push(utmCampaign);
    return { source: `UTM: ${parts.join(" / ")}`, referrer };
  }

  if (!referrer) {
    return { source: "直接访问", referrer: null };
  }

  try {
    const refUrl = new URL(referrer);
    const host = refUrl.hostname.replace(/^www\./, "");
    const siteHost = getSiteHostname().replace(/^www\./, "");

    if (host === siteHost || host === "localhost") {
      return { source: "站内跳转", referrer };
    }

    return {
      source: KNOWN_SOURCES[refUrl.hostname] || KNOWN_SOURCES[host] || host,
      referrer,
    };
  } catch {
    return { source: "未知来源", referrer };
  }
}

export async function getOrCreateVisitorId() {
  const cookieStore = await cookies();
  const existing = verifySignedSession<VisitorSession>(
    cookieStore.get(VISITOR_COOKIE)?.value
  );

  if (existing?.id) {
    return { visitorId: existing.id, isNew: false };
  }

  const visitorId = randomUUID();
  return { visitorId, isNew: true };
}

export function createVisitorCookie(visitorId: string) {
  return {
    name: VISITOR_COOKIE,
    value: createSignedSession<VisitorSession>({ id: visitorId }, VISITOR_MAX_AGE),
    options: {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax" as const,
      maxAge: VISITOR_MAX_AGE,
      path: "/",
    },
  };
}

export async function recordSiteVisit(input: {
  visitorId: string;
  path: string;
  referrer: string | null;
  search: string;
}) {
  const { source, referrer } = resolveVisitSource(input.referrer, input.search);
  const path = input.path.slice(0, 500);

  const recent = await prisma.siteVisit.findFirst({
    where: {
      visitorId: input.visitorId,
      path,
      createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    select: { id: true },
  });

  if (recent) {
    return { recorded: false, source };
  }

  await prisma.siteVisit.create({
    data: {
      visitorId: input.visitorId,
      path,
      referrer: referrer?.slice(0, 2000) ?? null,
      source: source.slice(0, 200),
    },
  });

  return { recorded: true, source };
}

async function countUniqueVisitors(since: Date) {
  const rows = await prisma.siteVisit.findMany({
    where: { createdAt: { gte: since } },
    distinct: ["visitorId"],
    select: { visitorId: true },
  });
  return rows.length;
}

export interface VisitSourceStat {
  source: string;
  visitors: number;
  visits: number;
}

export async function getVisitStats() {
  const [dayStart, weekStart, monthStart] = [
    getShanghaiDayStart(),
    getShanghaiWeekStart(),
    getShanghaiMonthStart(),
  ];

  const [today, thisWeek, thisMonth, sourceRows] = await Promise.all([
    countUniqueVisitors(dayStart),
    countUniqueVisitors(weekStart),
    countUniqueVisitors(monthStart),
    prisma.$queryRaw<{ source: string; visitors: bigint; visits: bigint }[]>`
      SELECT
        source,
        COUNT(DISTINCT visitorId) AS visitors,
        COUNT(*) AS visits
      FROM SiteVisit
      WHERE createdAt >= ${monthStart}
      GROUP BY source
      ORDER BY visitors DESC, visits DESC
      LIMIT 10
    `,
  ]);

  const topSources: VisitSourceStat[] = sourceRows.map((row) => ({
    source: row.source,
    visitors: Number(row.visitors),
    visits: Number(row.visits),
  }));

  return { today, thisWeek, thisMonth, topSources };
}

export async function shouldRecordVisit() {
  if (await isAdminAuthenticated()) {
    return false;
  }
  return true;
}
