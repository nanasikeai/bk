"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getTrackPath(pathname: string, search: string) {
  return `${pathname}${search ? `?${search}` : ""}`;
}

function resolvePageReferrer(previousPath: string | null) {
  const pageReferrer = document.referrer || null;

  if (!previousPath) {
    return pageReferrer;
  }

  if (!pageReferrer || pageReferrer.startsWith(window.location.origin)) {
    return `${window.location.origin}${previousPath}`;
  }

  return pageReferrer;
}

export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/login")
    ) {
      return;
    }

    const path = getTrackPath(pathname, searchParams.toString());
    if (lastTracked.current === path) {
      return;
    }
    lastTracked.current = path;

    const referrer = resolvePageReferrer(previousPath.current);
    previousPath.current = path;

    void fetch("/api/visits/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer }),
      keepalive: true,
    });
  }, [pathname, searchParams]);

  return null;
}
