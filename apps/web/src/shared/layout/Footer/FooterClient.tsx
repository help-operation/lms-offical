"use client";

import Link from "next/link";
import {
  Globe, MessageCircle, Camera, Briefcase, Play,
  Phone, Mail, GraduationCap,
} from "lucide-react";
import type { SocialLinks } from "@/features/cms/api/settings";

// SVG social icons (lucide-react v1.14 doesn't have brand icons)
export const FacebookIcon  = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
export const YoutubeIcon   = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>;
export const WhatsAppIcon  = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
export const InstagramIcon = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
export const LinkedinIcon  = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
export const TwitterIcon   = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;

export type FooterSettings = {
  footer_site_name: string;
  footer_description: string;
  footer_address: string;
  footer_phone: string;
  footer_email: string;
  footer_students_count: string;
  footer_courses_count: string;
  footer_copyright: string;
  /** When true, footer_copyright is just the text after "© <year>" — the year is prefixed client-side. */
  footer_copyright_auto_year?: boolean;
  footer_trade_license?: string;
  payment_strip_image?: string;
  logo_url?: string;
  logo_url_dark?: string;
};

/** Prefixes "© <current year>" client-side when the text came from the auto-year field. */
export function formatFooterCopyright(settings: FooterSettings): string {
  if (!settings.footer_copyright) return "";
  return settings.footer_copyright_auto_year
    ? `© ${new Date().getFullYear()} ${settings.footer_copyright}`
    : settings.footer_copyright;
}

export type FooterLink = {
  id: number;
  label: string;
  url: string;
  isExternal: boolean;
  openInNewTab: boolean;
};

type Props = {
  settings: FooterSettings;
  companyLinks?: FooterLink[];
  otherLinks?: FooterLink[];
  socialLinks?: SocialLinks;
};

// Fallbacks — used only if the menus API returns nothing for a column.
// Exported so the header's mobile drawer can reuse the same defaults.
export const DEFAULT_COMPANY: FooterLink[] = [
  { id: -1, label: "About Us",           url: "/about",            isExternal: false, openInNewTab: false },
  { id: -2, label: "Contact",            url: "/contact",          isExternal: false, openInNewTab: false },
  { id: -3, label: "Join as Instructor", url: "/join-as-instructor", isExternal: false, openInNewTab: false },
  { id: -4, label: "Privacy Policy",     url: "/privacy-policy",   isExternal: false, openInNewTab: false },
  { id: -5, label: "Return Policy",      url: "/return-policy",    isExternal: false, openInNewTab: false },
  { id: -6, label: "Terms & Conditions", url: "/terms-conditions", isExternal: false, openInNewTab: false },
];

export const DEFAULT_OTHERS: FooterLink[] = [
  { id: -11, label: "Upcoming Live Batch", url: "/live-classes",    isExternal: false, openInNewTab: false },
  { id: -12, label: "Blog",                url: "/blog",            isExternal: false, openInNewTab: false },
  { id: -13, label: "Free Courses",        url: "/free-courses",    isExternal: false, openInNewTab: false },
  { id: -14, label: "Success Stories",     url: "/success-stories", isExternal: false, openInNewTab: false },
  { id: -15, label: "Mentors",             url: "/our-instructor",  isExternal: false, openInNewTab: false },
  { id: -16, label: "Verify Certificate",  url: "/verify",          isExternal: false, openInNewTab: false },
  { id: -17, label: "Your Questions",      url: "/faq",             isExternal: false, openInNewTab: false },
];

export function FooterNavLink({ item, className }: { item: FooterLink; className?: string }) {
  if (item.isExternal) {
    return (
      <a
        href={item.url}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noreferrer" : undefined}
        className={className}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.url} target={item.openInNewTab ? "_blank" : undefined} className={className}>
      {item.label}
    </Link>
  );
}

const SOCIAL_META = [
  { key: "facebook",  Icon: FacebookIcon,   label: "Facebook"  },
  { key: "youtube",   Icon: YoutubeIcon,    label: "YouTube"   },
  { key: "whatsapp",  Icon: WhatsAppIcon,   label: "WhatsApp"  },
  { key: "instagram", Icon: InstagramIcon,  label: "Instagram" },
  { key: "linkedin",  Icon: LinkedinIcon,   label: "LinkedIn"  },
  { key: "twitter",   Icon: TwitterIcon,    label: "Twitter"   },
] as const;


export function FooterClient({ settings, companyLinks, otherLinks, socialLinks }: Props) {
  const company = companyLinks && companyLinks.length ? companyLinks : DEFAULT_COMPANY;
  const others = otherLinks && otherLinks.length ? otherLinks : DEFAULT_OTHERS;

  return (
    <>
      {/* ── Desktop Footer ────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div className="space-y-5">
              <Link href="/" className="flex items-center gap-2">
                {settings.logo_url ? (
                  settings.logo_url_dark && settings.logo_url_dark !== settings.logo_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.logo_url}
                        alt={settings.footer_site_name}
                        className="h-10 w-auto object-contain dark:hidden"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.logo_url_dark}
                        alt={settings.footer_site_name}
                        className="hidden h-10 w-auto object-contain dark:block"
                      />
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.logo_url}
                      alt={settings.footer_site_name}
                      className="h-10 w-auto object-contain"
                    />
                  )
                ) : (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </span>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                      {settings.footer_site_name}
                    </span>
                  </>
                )}
              </Link>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {settings.footer_description}
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Company
              </h4>
              <ul className="space-y-3">
                {company.map((item) => (
                  <li key={item.id}>
                    <FooterNavLink
                      item={item}
                      className="text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Others */}
            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Others
              </h4>
              <ul className="space-y-3">
                {others.map((item) => (
                  <li key={item.id}>
                    <FooterNavLink
                      item={item}
                      className="text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Contact
              </h4>
              <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                {settings.footer_phone && (
                  <a
                    href={`tel:${settings.footer_phone}`}
                    className="flex items-center gap-2 hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    <Phone className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    Call: {settings.footer_phone}
                  </a>
                )}
                {settings.footer_email && (
                  <a
                    href={`mailto:${settings.footer_email}`}
                    className="flex items-center gap-2 hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    <Mail className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    {settings.footer_email}
                  </a>
                )}
                {socialLinks && SOCIAL_META.some((s) => socialLinks[s.key]) && (
                  <div>
                    <p className="mb-3">Social media:</p>
                    <div className="flex items-center gap-2">
                      {SOCIAL_META.filter((s) => socialLinks[s.key]).map(({ key, Icon, label }) => (
                        <a
                          key={key}
                          href={socialLinks[key]}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={label}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-brand-600 dark:bg-gray-800 dark:hover:bg-brand-600"
                        >
                          <Icon />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment strip */}
          {settings.payment_strip_image && (
            <div className="mt-12 flex items-center justify-center border-t border-gray-100 pt-8 dark:border-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.payment_strip_image}
                alt="Accepted payment methods"
                className="h-auto w-full max-w-4xl object-contain"
              />
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-gray-500 dark:text-gray-400 md:flex-row">
            {settings.footer_copyright && <p>{formatFooterCopyright(settings)}</p>}
            {settings.footer_trade_license && <p>{settings.footer_trade_license}</p>}
          </div>
        </div>
      </footer>
    </>
  );
}
