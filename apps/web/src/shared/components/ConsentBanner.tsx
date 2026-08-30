"use client";

import { useEffect, useState } from "react";
import { getStoredConsent, setConsent } from "@/shared/utils/consent";

/**
 * Visitor-facing accept/decline banner — the missing piece that makes
 * Consent Mode v2 actually work end-to-end. Everything else (default-denied
 * push, ConsentUpdate, the registry toggle) was already wired; this is the
 * only UI that ever calls setConsent(), so without it every visitor stays
 * "denied" forever. Renders only when the visitor hasn't decided yet, and
 * only when the parent has already checked the consent_mode registry item
 * is enabled (see app/layout.tsx) — no point showing this while that's off.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getStoredConsent() === undefined);
  }, []);

  if (!visible) return null;

  function choose(value: "granted" | "denied") {
    setConsent(value);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          We use cookies to understand how you use our site and improve your experience. You can
          accept or decline analytics/ads cookies — essential site functionality isn&rsquo;t affected either way.
        </p>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-from to-brand-to px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
