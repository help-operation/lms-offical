import { cookies } from "next/headers";
import { CONSENT_COOKIE_NAME, type ConsentValue } from "@/shared/utils/consent";

/**
 * Reads the visitor's stored consent choice and pushes a Consent Mode v2
 * `update` command reflecting it. Split out from the static default-denied
 * push in app/layout.tsx (which needs no cookie and can stay in the static
 * shell) because `cookies()` forces this component's subtree dynamic —
 * isolating it here, wrapped in <Suspense> at the call site, keeps the rest
 * of the root layout prerenderable, same pattern as PageviewTracker/CodeSnippets.
 * `gtag('consent','default',...,{wait_for_update:500})` in layout.tsx already
 * tells GTM/GA to hold tag firing briefly for this update to arrive.
 */
export async function ConsentUpdate() {
  const store = await cookies();
  const consentCookie = store.get(CONSENT_COOKIE_NAME)?.value as ConsentValue | undefined;
  if (!consentCookie) return null;

  const state = consentCookie === "granted" ? "granted" : "denied";

  return (
    <script
      id="consent-mode-update"
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','update',{ad_storage:'${state}',ad_user_data:'${state}',ad_personalization:'${state}',analytics_storage:'${state}'});`,
      }}
    />
  );
}
