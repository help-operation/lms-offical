export const CONSENT_COOKIE_NAME = "sk_consent";

export type ConsentValue = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Reads the visitor's stored consent choice, or `undefined` if they haven't decided yet. */
export function getStoredConsent(): ConsentValue | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]+)`));
  const value = match?.[1];
  return value === "granted" || value === "denied" ? value : undefined;
}

/**
 * Persists the visitor's consent choice and pushes a Consent Mode v2 `update`
 * command immediately — no reload required, per the consent-mode spec's
 * "withdraw consent" scenario.
 */
export function setConsent(value: ConsentValue) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
  const state = value === "granted" ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}
