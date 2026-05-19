import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  createVisitorCookie,
  getOrCreateVisitorId,
  isBotUserAgent,
  recordSiteVisit,
  shouldRecordVisit,
  shouldSkipVisitPath,
} from "@/lib/visit-tracking";

export async function POST(request: NextRequest) {
  try {
    if (!(await shouldRecordVisit())) {
      return new NextResponse(null, { status: 204 });
    }

    const userAgent = request.headers.get("user-agent");
    if (isBotUserAgent(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`visit-track:${ip}`, 120, 60_000);
    if (!rate.allowed) {
      return new NextResponse(null, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path : "/";
    const pathname = path.split("?")[0] || "/";

    if (shouldSkipVisitPath(pathname)) {
      return new NextResponse(null, { status: 204 });
    }

    const { visitorId, isNew } = await getOrCreateVisitorId();
    const referrer = request.headers.get("referer");
    const search = path.includes("?") ? path.slice(path.indexOf("?")) : "";

    await recordSiteVisit({
      visitorId,
      path: pathname,
      referrer,
      search,
    });

    if (isNew) {
      const cookieStore = await cookies();
      const visitorCookie = createVisitorCookie(visitorId);
      cookieStore.set(
        visitorCookie.name,
        visitorCookie.value,
        visitorCookie.options
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Visit track error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
