import { getPublicPageSections } from "@/features/cms/api/page-sections";
import { getPublicMenus } from "@/features/cms/api/menus";
import { getPublicSiteSettings, getPublicSocialLinks, getPublicContactSettings, type SocialLinks } from "@/features/cms/api/settings";
import { FooterClient, DEFAULT_COMPANY, type FooterSettings } from "./FooterClient";
import { ElevateFooterClient } from "./ElevateFooterClient";

export async function FooterWrapper() {
  const [sections, menus, siteSettings, socialLinks, contactSettings, generalSettings] = await Promise.all([
    getPublicPageSections("footer"),
    getPublicMenus(),
    getPublicSiteSettings(),
    getPublicSocialLinks(),
    getPublicContactSettings(),
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
        const res = await fetch(
          `${apiUrl}/system-settings/public?keys=general_copyright,general_trade_license`,
          { next: { revalidate: 300, tags: ["general-settings"] } },
        );
        if (!res.ok) return null;
        const json = await res.json();
        return (json?.data ?? json) as Record<string, string>;
      } catch { return null; }
    })(),
  ]);

  // Find the footer_info section and map its content to FooterSettings keys
  const raw = sections.find((s) => s.type === "footer_info")?.content ?? {};

  // "© <current year>" is prefixed automatically — admins only type the text
  // after it (e.g. "LMS. All rights reserved."). The Website Sections → Footer
  // copyright field stays freeform since it predates this convention. The year
  // itself is computed client-side (FooterClient/ElevateFooterClient) — calling
  // new Date() here would block static prerendering of this Server Component.
  const copyrightText = generalSettings?.general_copyright?.trim();
  const footerCopyright = copyrightText || (raw.copyright as string) || "";

  const settings: FooterSettings = {
    logo_url:              siteSettings.logo_url || "",
    logo_url_dark:         siteSettings.logo_url_dark || "",
    footer_site_name:      siteSettings.site_name || (raw.site_name as string) || "",
    footer_description:    (raw.description    as string) || "",
    footer_address:        (raw.address        as string) || "",
    footer_phone:          contactSettings.general_contact_phone || (raw.phone as string) || "",
    footer_email:          contactSettings.general_contact_email || (raw.email as string) || "",
    footer_students_count: (raw.students_count as string) || "",
    footer_courses_count:  (raw.courses_count  as string) || "",
    footer_copyright:      footerCopyright,
    footer_copyright_auto_year: !!copyrightText,
    footer_trade_license:  generalSettings?.general_trade_license || "",
    payment_strip_image:   (raw.payment_strip_image as string) || "",
  };

  // The "Elevate" home template gets its own footer design (green newsletter
  // banner + light footer) — every other template keeps the default footer.
  if (siteSettings.home_template === "home-v1") {
    const legalLinks = (menus.footer_company?.length ? menus.footer_company : DEFAULT_COMPANY).filter(
      (l) => l.url.includes("policy") || l.url.includes("terms"),
    );
    return (
      <ElevateFooterClient
        settings={settings}
        legalLinks={legalLinks}
        companyLinks={menus.footer_company}
        otherLinks={menus.footer_others}
        socialLinks={socialLinks}
        phone2={contactSettings.general_contact_phone2}
      />
    );
  }

  return (
    <FooterClient
      settings={settings}
      companyLinks={menus.footer_company}
      otherLinks={menus.footer_others}
      socialLinks={socialLinks}
    />
  );
}
