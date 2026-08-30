import { Suspense } from "react";
import { FooterWrapper } from "@/shared/layout/Footer/FooterWrapper";
import { MobileBottomNav } from "@/shared/layout/MobileBottomNav";
import { ScrollToTopButton } from "@/shared/layout/ScrollToTopButton";
import { CallbackWidget } from "@/features/leads/components/CallbackWidget";
import { BannersMount } from "@/features/banners/BannersMount";
import { getPublicContactSettings, getPublicSiteSettings } from "@/features/cms/api/settings";

// Live-course landing pages replace the site's main header with their own
// promo bar (logo + countdown + price + Enroll) built into each template —
// see LiveCoursePromoBar — so this layout intentionally omits <PublicHeader />.
// Everything else (footer, mobile nav, callback widget) stays the same as
// the (public) layout.
export default async function LiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contact, siteSettings] = await Promise.all([
    getPublicContactSettings(),
    getPublicSiteSettings(),
  ]);
  const mobileNavAlwaysVisible = siteSettings.home_template === "home-v1";
  return (
    <>
      <Suspense fallback={null}>
        <BannersMount />
      </Suspense>
      <Suspense fallback={null}>{children}</Suspense>
      <Suspense fallback={null}>
        <FooterWrapper />
      </Suspense>
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <Suspense fallback={null}>
        <MobileBottomNav alwaysVisible={mobileNavAlwaysVisible} />
        <ScrollToTopButton navAlwaysVisible={mobileNavAlwaysVisible} />
        <CallbackWidget whatsappUrl={contact.general_support_whatsapp} navAlwaysVisible={mobileNavAlwaysVisible} />
      </Suspense>
    </>
  );
}
