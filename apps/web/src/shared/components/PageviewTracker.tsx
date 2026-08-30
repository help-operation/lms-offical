"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/shared/utils/dataLayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const SESSION_COOKIE = "sk_vid";

function getOrCreateSessionId(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  if (match) return match[1]!;

  const id = crypto.randomUUID();
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${SESSION_COOKIE}=${id}; path=/; max-age=${oneYear}; SameSite=Lax`;
  return id;
}

/**
 * Fires the pageview beacon on every navigation and records how long the
 * visitor stayed on the previous page via sendBeacon on unload — the one
 * mechanism that reliably completes as the page goes away.
 */
export function PageviewTracker() {
  const pathname = usePathname();
  const prevVisit = useRef<{ id: number; startedAt: number } | null>(null);

  useEffect(() => {
    // GTM dataLayer — page_view. Needed because this is a Next.js SPA: GTM's
    // own snippet only sees the initial hard load, not client-side route changes.
    trackPageView(pathname);

    // Report the previous page's stay duration before recording the new one.
    if (prevVisit.current) {
      const seconds = Math.round((Date.now() - prevVisit.current.startedAt) / 1000);
      sendDuration(prevVisit.current.id, seconds);
      prevVisit.current = null;
    }

    const sessionId = getOrCreateSessionId();
    // Wrapped in try/catch, not just .catch() — some browser extensions
    // (ad/tracker blockers) monkey-patch window.fetch to throw synchronously
    // instead of rejecting, which a .catch() chain can't intercept.
    try {
      fetch(`${API_URL}/tracking/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, referrer: document.referrer || undefined, sessionId }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json?.data?.id) prevVisit.current = { id: json.data.id, startedAt: Date.now() };
        })
        .catch(() => {});
    } catch {
      /* analytics is best-effort — never let it break the page */
    }

    function handleUnload() {
      if (prevVisit.current) {
        const seconds = Math.round((Date.now() - prevVisit.current.startedAt) / 1000);
        sendDuration(prevVisit.current.id, seconds);
      }
    }
    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, [pathname]);

  return null;
}

function sendDuration(id: number, seconds: number) {
  const payload = JSON.stringify({ seconds });
  const url = `${API_URL}/tracking/visit/${id}/duration`;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch {
    /* analytics is best-effort — never let it break the page */
  }
}
