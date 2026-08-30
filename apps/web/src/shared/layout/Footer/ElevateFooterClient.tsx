"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, GraduationCap } from "lucide-react";
import type { SocialLinks } from "@/features/cms/api/settings";
import type { FooterSettings, FooterLink } from "./FooterClient";
import { DEFAULT_COMPANY, DEFAULT_OTHERS, FooterNavLink, FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, WhatsAppIcon, formatFooterCopyright } from "./FooterClient";

type Props = {
  settings: FooterSettings;
  legalLinks?: FooterLink[];
  companyLinks?: FooterLink[];
  otherLinks?: FooterLink[];
  socialLinks?: SocialLinks;
  phone2?: string;
};

const SOCIAL_META = [
  { key: "facebook", Icon: FacebookIcon, label: "Facebook" },
  { key: "youtube", Icon: YoutubeIcon, label: "YouTube" },
  { key: "whatsapp", Icon: WhatsAppIcon, label: "WhatsApp" },
  { key: "instagram", Icon: InstagramIcon, label: "Instagram" },
  { key: "linkedin", Icon: LinkedinIcon, label: "LinkedIn" },
  { key: "twitter", Icon: TwitterIcon, label: "Twitter" },
] as const;

function DecorativeLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 220"
      className="pointer-events-none absolute bottom-0 right-0 h-40 w-72 text-amber-400"
    >
      <path d="M400 0 L60 220" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M400 30 L100 220" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M400 60 L140 220" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ElevateFooterClient({ settings, legalLinks, companyLinks, otherLinks, socialLinks, phone2 }: Props) {
  const legal = legalLinks && legalLinks.length ? legalLinks : DEFAULT_COMPANY.filter((l) => l.url.includes("policy") || l.url.includes("terms"));
  const company = companyLinks && companyLinks.length ? companyLinks : DEFAULT_COMPANY;
  const resources = otherLinks && otherLinks.length ? otherLinks : DEFAULT_OTHERS;

  return (
    <footer className="border-t border-brand-100 bg-white transition-colors duration-300 dark:border-gray-800 dark:bg-gray-950">
      {/* ── Main footer grid ──────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <DecorativeLines />

        <div className="container relative z-10 mx-auto grid grid-cols-1 items-start gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              {settings.logo_url ? (
                settings.logo_url_dark && settings.logo_url_dark !== settings.logo_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.logo_url} alt={settings.footer_site_name} className="h-10 w-auto object-contain dark:hidden" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.logo_url_dark} alt={settings.footer_site_name} className="hidden h-10 w-auto object-contain dark:block" />
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logo_url} alt={settings.footer_site_name} className="h-10 w-auto object-contain" />
                )
              ) : (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </span>
                  <span className="text-xl font-extrabold text-gray-900 dark:text-white">{settings.footer_site_name}</span>
                </>
              )}
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">{settings.footer_description}</p>

            {socialLinks && SOCIAL_META.some((s) => socialLinks[s.key]) && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Follow Us</p>
                <div className="flex items-center gap-2">
                  {SOCIAL_META.filter((s) => socialLinks[s.key]).map(({ key, Icon, label }) => (
                    <a
                      key={key}
                      href={socialLinks[key]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 text-brand-600 transition-colors hover:bg-brand-600 hover:text-white dark:border-brand-900/50 dark:text-brand-400"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 text-sm font-bold text-gray-900 dark:text-white">Company</h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.id}>
                  <FooterNavLink item={item} className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400" />
                </li>
              ))}
            </ul>
          </div>

          {/* Others */}
          <div>
            <h4 className="mb-5 text-sm font-bold text-gray-900 dark:text-white">Others</h4>
            <ul className="space-y-3">
              {resources.map((item) => (
                <li key={item.id}>
                  <FooterNavLink item={item} className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400" />
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-sm font-bold text-gray-900 dark:text-white">Contact</h4>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              {settings.footer_phone && (
                <a href={`tel:${settings.footer_phone}`} className="flex items-center gap-2 hover:text-brand-600 dark:hover:text-brand-400">
                  <Phone className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  {settings.footer_phone}
                </a>
              )}
              {phone2 && (
                <a href={`tel:${phone2}`} className="flex items-center gap-2 hover:text-brand-600 dark:hover:text-brand-400">
                  <Phone className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  {phone2}
                </a>
              )}
              {settings.footer_email && (
                <a href={`mailto:${settings.footer_email}`} className="flex items-center gap-2 hover:text-brand-600 dark:hover:text-brand-400">
                  <Mail className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  {settings.footer_email}
                </a>
              )}
              {settings.footer_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  {settings.footer_address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────── */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-gray-500 dark:text-gray-400 md:flex-row">
          {settings.footer_copyright && <p>{formatFooterCopyright(settings)}</p>}
          <div className="flex items-center gap-5">
            {legal.map((item) => (
              <Link key={item.id} href={item.url} className="hover:text-brand-600 dark:hover:text-brand-400">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
