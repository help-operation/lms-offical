import { Suspense } from "react";
import { FooterWrapper } from "@/shared/layout/Footer/FooterWrapper";
import PublicHeader from "@/shared/layout/Header/PublicHeader";
import { MobileBottomNav } from "@/shared/layout/MobileBottomNav";
import { ScrollToTopButton } from "@/shared/layout/ScrollToTopButton";
import { CallbackWidget } from "@/features/leads/components/CallbackWidget";
import { BannersMount } from "@/features/banners/BannersMount";
import { getPublicContactSettings, getPublicSiteSettings } from "@/features/cms/api/settings";
import { getPublicPageSections } from "@/features/cms/api/page-sections";
import NewsletterSection, { type NewsletterContent } from "@repo/ui/home-v1-newsletter";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contact, siteSettings, homeV1Sections] = await Promise.all([
    getPublicContactSettings(),
    getPublicSiteSettings(),
    getPublicPageSections("home-v1"),
  ]);
  const isElevateTemplate = siteSettings.home_template === "home-v1";
  // The Elevate home template's mobile nav stays permanently visible instead
  // of sliding away on scroll, matching its own footer's fixed nav style.
  const mobileNavAlwaysVisible = isElevateTemplate;
  // The Elevate template's newsletter banner is site-wide (every page, right
  // above the footer) rather than a homepage-only CMS section — same admin
  // content, just rendered from the shared layout instead of the home page's
  // section list. See apps/web/src/app/(public)/page.tsx, which no longer
  // renders the "newsletter_v2" section type to avoid double-rendering it.
  const newsletterContent = homeV1Sections.find((s) => s.type === "newsletter_v2")?.content as
    | NewsletterContent
    | undefined;
  return (
    <>
      <PublicHeader />
      <Suspense fallback={null}>
        <BannersMount />
      </Suspense>
      <Suspense fallback={null}>{children}</Suspense>
      {isElevateTemplate && <NewsletterSection content={newsletterContent} />}
      <Suspense fallback={null}>
        <FooterWrapper />
      </Suspense>
      {/* Spacer so the fixed mobile bottom nav never covers the footer's own content */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      {/* Wrapped in Suspense — all three read usePathname() (dynamic request
          data), which must not block the prerendered shell under cacheComponents. */}
      <Suspense fallback={null}>
        <MobileBottomNav alwaysVisible={mobileNavAlwaysVisible} />
        <ScrollToTopButton navAlwaysVisible={mobileNavAlwaysVisible} />
        {/* Global "Request a Callback" floating widget — public pages only */}
        <CallbackWidget whatsappUrl={contact.general_support_whatsapp} navAlwaysVisible={mobileNavAlwaysVisible} />
      </Suspense>
    </>
  );
}
