import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import QueryProvider from "@/shared/providers/query-provider";
import { SnippetInjector } from "@/shared/components/SnippetInjector";
import { PageviewTracker } from "@/shared/components/PageviewTracker";
import { ConsentUpdate } from "@/shared/components/ConsentUpdate";
import { ConsentBanner } from "@/shared/components/ConsentBanner";
import { UserContext } from "@/shared/components/UserContext";
import { getPublicSiteSettings } from "@/features/cms/api/settings";
import { generateBrandScale, brandScaleToCssVars, isHexColor } from "@/shared/utils/color";
import { buildFontLinks } from "@/shared/utils/font-registry";

// Built-in per-template default color, keyed by `general_home_template` id.
// Applies only when the admin hasn't picked an explicit color for that
// template on /admin/content/home-templates (see effectiveColor below).
// Keep in sync with apps/admin/src/features/home-page-templates/registry.ts.
const TEMPLATE_DEFAULT_COLORS: Record<string, string> = {
  "home-v1": "#2563eb", // ESkills Green
};

async function getSiteSettings() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${apiUrl}/system-settings/public?keys=general_site_name,general_favicon_url,general_tagline,general_english_font,general_bangla_font`,
      // Font settings need shorter cache so changes appear quickly.
      // Other settings (site_name, favicon, tagline) can be cached longer.
      { signal: AbortSignal.timeout(8_000), next: { revalidate: 300, tags: ["general-settings"] } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName   = settings?.general_site_name   || "Skillkoro Academy";
  const tagline    = settings?.general_tagline      || "Learn. Grow. Succeed.";
  const faviconUrl = settings?.general_favicon_url  || null;

  return {
    title: {
      default:  siteName,
      template: `%s | ${siteName}`,
    },
    description: tagline,
    icons: faviconUrl
      ? { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl }
      : undefined,
  };
}

// ─── Tracking config ──────────────────────────────────────────────────────────
//
// Two sources feed the tracking layer:
//  - /tracking-items (registry) — every toggleable capability (tags, events,
//    content/user context, engagement). Replaces the old fixed columns.
//  - /tracking-settings (legacy row) — kept only for `gscVerification`, a
//    static meta tag with no on/off concept, not a "capability".

interface TrackingItemPublic {
  key: string;
  category: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

type TrackingRegistry = Record<string, { enabled: boolean; config: Record<string, unknown> }>;

async function getTrackingItems(): Promise<TrackingItemPublic[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(`${apiUrl}/tracking-items`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600, tags: ["tracking-settings"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = json?.data ?? json;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function toRegistry(items: TrackingItemPublic[]): TrackingRegistry {
  const map: TrackingRegistry = {};
  for (const item of items) map[item.key] = { enabled: item.enabled, config: item.config ?? {} };
  return map;
}

async function getGscVerification(): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(`${apiUrl}/tracking-settings`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600, tags: ["tracking-settings"] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json;
    return data?.gscVerification ?? null;
  } catch {
    return null;
  }
}

// ─── Code snippets ────────────────────────────────────────────────────────────

interface CodeSnippet {
  id:        number;
  name:      string;
  code:      string;
  location:  "head" | "body_start" | "body_end";
  scope:     "global" | "specific";
  pages:     string[];
  isEnabled: boolean;
}

async function getCodeSnippets(): Promise<CodeSnippet[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(`${apiUrl}/code-snippets`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600, tags: ["code-snippets"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = json?.data ?? json;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Render the snippet injector inside its own boundary. SnippetInjector is a
// client component that reads usePathname() (dynamic request data); under
// cacheComponents it must live inside <Suspense> or it blocks the prerendered
// shell — but only when snippets actually exist (prod), which is why this only
// failed on the production deployment.
async function CodeSnippets() {
  const snippets = await getCodeSnippets();
  if (snippets.length === 0) return null;
  return <SnippetInjector snippets={snippets} />;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [items, settings, gscVerification] = await Promise.all([
    getTrackingItems(),
    getSiteSettings(),
    getGscVerification(),
  ]);
  const { home_template, template_colors } = await getPublicSiteSettings();

  const registry = toRegistry(items);
  const isOn = (key: string) => registry[key]?.enabled ?? false;
  const configId = (key: string) => (registry[key]?.config?.id as string | undefined) || null;

  // Color priority: the active template's own color (set per-card on
  // /admin/content/home-templates) wins; otherwise fall back to that
  // template's built-in default color; if neither is set, the base purple
  // palette in globals.css applies as-is.
  const templateColor = template_colors[home_template];
  const effectiveColor =
    templateColor && isHexColor(templateColor)
      ? templateColor
      : (TEMPLATE_DEFAULT_COLORS[home_template] ?? null);
  const brandStyle = effectiveColor
    ? (brandScaleToCssVars(generateBrandScale(effectiveColor)) as React.CSSProperties)
    : undefined;

  // Font settings — apply selected fonts via CSS custom properties
  const englishFont = settings?.general_english_font || "Poppins";
  const banglaFont = settings?.general_bangla_font || "Hind Siliguri";
  const fontFamilyFallback = "ui-sans-serif, system-ui, sans-serif";
  const fontStyle: React.CSSProperties = {
    "--font-sans": `'${englishFont}', '${banglaFont}', ${fontFamilyFallback}`,
    "--font-bengali": `'${banglaFont}', '${englishFont}', ${fontFamilyFallback}`,
    "--font-family-heading": `'${englishFont}', ${fontFamilyFallback}`,
    "--font-family-body": `'${englishFont}', '${banglaFont}', ${fontFamilyFallback}`,
  } as React.CSSProperties;

  // Google Fonts CDN links (replaces next/font/google which breaks Turbopack)
  const fontCdnLinks = buildFontLinks(englishFont, banglaFont);

  const gtmId = isOn("gtm") ? configId("gtm") : null;
  const ga4Id = isOn("ga4") ? configId("ga4") : null;
  const fbPixelId = isOn("fb_pixel") ? configId("fb_pixel") : null;
  const clarityId = isOn("clarity") ? configId("clarity") : null;
  const gadsId = isOn("gads") ? configId("gads") : null;
  const consentModeOn = isOn("consent_mode");

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" style={{ ...brandStyle, ...fontStyle }}>
      <head>
        {/* Google Fonts — loaded via CDN (no next/font/google needed) */}
        {fontCdnLinks.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}

        {/* Theme flash prevention */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('skillkoro-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />

        {/* Google Search Console verification */}
        {gscVerification && (
          <meta name="google-site-verification" content={gscVerification} />
        )}

        {/* Tracking-item registry — admin-controlled per-item on/off, read by
            shared/utils/dataLayer.ts before every push. Must be set before any
            client component's effects run, so it's inlined here rather than
            fetched client-side. */}
        <script
          id="tracking-registry-config"
          dangerouslySetInnerHTML={{
            __html: `window.__trackingRegistry=${JSON.stringify(registry)};`,
          }}
        />

        {/* ── Consent Mode v2 — static default-denied state, needs no cookie so it
            stays in the prerenderable shell. wait_for_update gives the (dynamic,
            cookie-dependent) ConsentUpdate below up to 500ms to arrive before GTM/GA
            fire tags for real. Gated on the consent_mode registry item — when off,
            no consent commands are sent at all, so GTM/GA fire and count visitors
            unconditionally (pre-Consent-Mode behavior). ── */}
        {consentModeOn && (
          <Script id="consent-mode-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
          </Script>
        )}

        {/* ── GTM (via @next/third-parties) ── controls all other tags when set ── */}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}

        {/* ── GA4 (via @next/third-parties) ── */}
        {ga4Id && <GoogleAnalytics gaId={ga4Id} />}

        {/* ── Facebook Pixel ── no @next/third-parties equivalent, stays manual ── */}
        {fbPixelId && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`}
          </Script>
        )}

        {/* ── Google Ads ── no @next/third-parties equivalent, stays manual ── */}
        {gadsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gadsId}`}
              strategy="afterInteractive"
            />
            <Script id="gads-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gadsId}');`}
            </Script>
          </>
        )}

        {/* ── Microsoft Clarity ── no @next/third-parties equivalent, stays manual ── */}
        {clarityId && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
          </Script>
        )}
      </head>

      <body className="font-sans">
        {/* Cookie-dependent tracking pushes — isolated in their own Suspense boundaries
            (same reason as CodeSnippets/PageviewTracker below) so reading cookies() here
            doesn't force the whole root layout dynamic. Placed first in body so these
            inline scripts run before GTM's async-loaded script processes dataLayer. */}
        {consentModeOn && (
          <Suspense fallback={null}>
            <ConsentUpdate />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <UserContext />
        </Suspense>

        {/* GTM noscript fallback (body) — @next/third-parties does not render this for us */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {/* Facebook Pixel noscript */}
        {fbPixelId && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}

        <QueryProvider>{children}</QueryProvider>

        {/* Code snippet injector — wrapped in Suspense so its dynamic
            usePathname() never blocks the prerendered shell (cacheComponents). */}
        <Suspense fallback={null}>
          <CodeSnippets />
        </Suspense>

        {/* Wrapped in Suspense for the same reason as CodeSnippets above —
            PageviewTracker also reads usePathname() (dynamic request data),
            which must not block the prerendered shell under cacheComponents. */}
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>

        {/* Dormant while consent_mode is disabled — flips on the moment that
            registry item is re-enabled, no other code changes needed. */}
        {consentModeOn && <ConsentBanner />}
      </body>
    </html>
  );
}
