import {
  Phone,
  Smartphone,
  Mail,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import { UserSection } from "@/features/user/components/UserSection";
import { UserAvatarSkeleton } from "@/features/user/components/UserAvatarSkeleton";
import { MobileMenu } from "./MobileMenu";
import { CartLink } from "./CartLink";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { getPublicMenus, type MenuLink } from "@/features/cms/api/menus";
import { getPublicContactSettings, getPublicSiteSettings } from "@/features/cms/api/settings";
import { DEFAULT_COMPANY, DEFAULT_OTHERS } from "@/shared/layout/Footer/FooterClient";
import { SiteLogo } from "@/shared/components/SiteLogo";
import { MenuNavLink } from "./MenuNavLink";

// Fallbacks — used only if the menus API returns nothing, so the header is
// never empty even before the menu seed runs.
const DEFAULT_NAV: MenuLink[] = [
  { id: -1, label: "Home", url: "/", isExternal: false, openInNewTab: false },
  { id: -2, label: "All Courses", url: "/courses", isExternal: false, openInNewTab: false },
];

const DEFAULT_MORE: MenuLink[] = [
  { id: -3, label: "About Us", url: "/about", isExternal: false, openInNewTab: false },
  { id: -4, label: "Blog", url: "/blog", isExternal: false, openInNewTab: false },
  { id: -5, label: "Verify Certificate", url: "/verify", isExternal: false, openInNewTab: false },
  { id: -6, label: "Contact", url: "/contact", isExternal: false, openInNewTab: false },
];

const PublicHeader = async () => {
  const [menus, contact, site] = await Promise.all([
    getPublicMenus(),
    getPublicContactSettings(),
    getPublicSiteSettings(),
  ]);
  const logoSrc = site.logo_url || "/Skillkoro-logo.png";
  const logoDarkSrc = site.logo_url_dark || undefined;
  const logoAlt = site.site_name || "Skillkoro";
  const navigation = menus.navbar.length ? menus.navbar : DEFAULT_NAV;
  const moreNav = menus.navbar_more.length ? menus.navbar_more : DEFAULT_MORE;
  const companyLinks = menus.footer_company.length ? menus.footer_company : DEFAULT_COMPANY;
  const otherLinks = menus.footer_others.length ? menus.footer_others : DEFAULT_OTHERS;

  // The "ESkills Green" template's hero has its own colored background that
  // the header should blend into seamlessly — no utility bar, tinted main
  // bar instead of the default white/blurred one.
  const isGreenTemplate = site.home_template === "home-v1";

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ── Utility bar (hidden on mobile, and on the ESKills Green template) ── */}
      {!isGreenTemplate && (
        <div className="hidden md:block bg-gradient-to-r from-brand-from to-brand-to text-white text-sm">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
              <div className="flex gap-5">
                {contact.general_contact_phone && (
                  <a
                    href={`tel:${contact.general_contact_phone}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.general_contact_phone}
                  </a>
                )}
                {contact.general_contact_phone2 && (
                  <a
                    href={`tel:${contact.general_contact_phone2}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Smartphone className="h-4 w-4" />
                    {contact.general_contact_phone2}
                  </a>
                )}
              </div>
              {contact.general_contact_email && (
                <a
                  href={`mailto:${contact.general_contact_email}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {contact.general_contact_email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main bar ────────────────────────────────────────────────── */}
      <div
        className={
          isGreenTemplate
            ? "border-b border-brand-100 dark:border-gray-800 bg-brand-50/90 dark:bg-gray-900/90 backdrop-blur-md transition-colors duration-300"
            : "border-b border-gray-200 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/80 backdrop-blur-md shadow-sm transition-colors duration-300"
        }
      >
        <div
          className={`container mx-auto w-full relative flex justify-between items-center px-4 ${isGreenTemplate ? "py-4" : "py-2"
            }`}
        >

          {/* Left: hamburger + logo + animated search */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger + slide-out drawer. The drawer fetches its
                own auth state client-side (via /api/me) so reading the auth
                cookie never forces the public static shell to go dynamic. */}
            <MobileMenu
              navigation={navigation}
              moreNav={moreNav}
              companyLinks={companyLinks}
              otherLinks={otherLinks}
            />

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center">
              <SiteLogo
                lightSrc={logoSrc}
                darkSrc={logoDarkSrc}
                alt={logoAlt}
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

          </div>

          {/* Center Nav — desktop. Same CMS-managed `navigation`/`moreNav` data
              for every template; only the visual treatment (spacing, hover
              style) varies by `isGreenTemplate`. */}
          <nav
            className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center ${
              isGreenTemplate ? "gap-6" : "gap-5"
            }`}
          >
            {navigation.map((item) => (
              <MenuNavLink
                key={item.id}
                item={item}
                className={
                  isGreenTemplate
                    ? "font-medium text-gray-800 dark:text-gray-100 transition-colors hover:text-brand-700 dark:hover:text-brand-400"
                    : "relative font-medium block transition-colors duration-200 text-gray-800 dark:text-gray-100 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-brand-600 hover:to-brand-800"
                }
              />
            ))}

            {/* More dropdown — only when the admin has added items to it */}
            {moreNav.length > 0 && (
              <div className="group cursor-pointer relative">
                <button
                  className="font-medium flex items-center gap-2 text-gray-800 dark:text-gray-100"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  More <ChevronDown className="text-brand-600 h-4 w-4" />
                </button>
                <ul className="absolute bg-white dark:bg-gray-900 p-4 w-[220px] top-full left-0 rounded-lg flex flex-col gap-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 ease-in-out translate-y-2 group-hover:translate-y-0 shadow-lg dark:shadow-gray-900/50 border border-transparent dark:border-gray-700 z-50">
                  {moreNav.map((item) => (
                    <li key={item.id}>
                      <MenuNavLink
                        item={item}
                        className="relative font-medium block transition-colors duration-200 text-gray-800 dark:text-gray-100 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-brand-600 hover:to-brand-800"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>

          {/* Right: cart + user — desktop */}
          <div className="lg:flex hidden items-center justify-center gap-5">
            {isGreenTemplate ? (
              <>
                <Suspense fallback={<UserAvatarSkeleton />}>
                  <UserSection />
                </Suspense>
                <div className="h-8 w-px bg-brand-200/70 dark:bg-gray-700" />
                <div className="flex items-center gap-4">
                  <ThemeToggle iconOnly />
                  <Suspense fallback={null}>
                    <CartLink />
                  </Suspense>
                </div>
                <Link
                  href="/student/courses"
                  className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
                >
                  My Courses
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <ThemeToggle iconOnly />
                  <Suspense fallback={null}>
                    <CartLink />
                  </Suspense>
                </div>
                <div className="flex items-center gap-3 ml-1">
                  <Suspense fallback={<UserAvatarSkeleton />}>
                    <UserSection showJoinNow />
                  </Suspense>
                </div>
              </>
            )}
          </div>

          {/* Mobile: user section */}
          <div className="lg:hidden flex items-center gap-3">
            <Suspense fallback={<UserAvatarSkeleton />}>
              <UserSection />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
