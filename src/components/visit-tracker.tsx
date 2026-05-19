"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getTrackPath(pathname: string, search: string) {
  return `${pathname}${search ? `?${search}` : ""}`;
}

export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

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

    void fetch("/api/visits/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    });
  }, [pathname, searchParams]);

  return null;
}
