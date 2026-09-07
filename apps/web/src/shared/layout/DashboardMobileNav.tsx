"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { SiteLogo } from "@/shared/components/SiteLogo";
import type { NavItemColor } from "@/shared/layout/dashboard-nav";

const colorMap: Record<NavItemColor, { icon: string; activeBg: string; activeText: string; hoverBg: string; accent: string }> = {
  blue:   { icon: "text-blue-500",    activeBg: "bg-blue-50",    activeText: "text-blue-700",    hoverBg: "hover:bg-blue-50/60",  accent: "bg-blue-500" },
  purple: { icon: "text-violet-500",  activeBg: "bg-violet-50",  activeText: "text-violet-700",  hoverBg: "hover:bg-violet-50/60",accent: "bg-violet-500" },
  orange: { icon: "text-orange-500",  activeBg: "bg-orange-50",  activeText: "text-orange-700",  hoverBg: "hover:bg-orange-50/60",accent: "bg-orange-500" },
  rose:   { icon: "text-rose-500",    activeBg: "bg-rose-50",    activeText: "text-rose-700",    hoverBg: "hover:bg-rose-50/60",  accent: "bg-rose-500" },
  amber:  { icon: "text-amber-500",   activeBg: "bg-amber-50",   activeText: "text-amber-700",   hoverBg: "hover:bg-amber-50/60", accent: "bg-amber-500" },
  emerald:{ icon: "text-emerald-500", activeBg: "bg-emerald-50", activeText: "text-emerald-700", hoverBg: "hover:bg-emerald-50/60",accent: "bg-emerald-500" },
  cyan:   { icon: "text-cyan-500",    activeBg: "bg-cyan-50",    activeText: "text-cyan-700",    hoverBg: "hover:bg-cyan-50/60",  accent: "bg-cyan-500" },
  pink:   { icon: "text-pink-500",    activeBg: "bg-pink-50",    activeText: "text-pink-700",    hoverBg: "hover:bg-pink-50/60",  accent: "bg-pink-500" },
  slate:  { icon: "text-slate-400",   activeBg: "bg-slate-100",  activeText: "text-slate-700",   hoverBg: "hover:bg-slate-50",    accent: "bg-slate-400" },
  brand:  { icon: "text-brand-600",   activeBg: "bg-brand-50",   activeText: "text-brand-700",   hoverBg: "hover:bg-brand-50/60", accent: "bg-brand-500" },
};

const darkColorMap: Record<NavItemColor, { icon: string; activeBg: string; activeText: string; hoverBg: string; accent: string }> = {
  blue:   { icon: "text-blue-400",    activeBg: "bg-blue-500/10",  activeText: "text-blue-300",  hoverBg: "hover:bg-blue-500/10",  accent: "bg-blue-500" },
  purple: { icon: "text-violet-400",  activeBg: "bg-violet-500/10",activeText: "text-violet-300",hoverBg: "hover:bg-violet-500/10",accent: "bg-violet-500" },
  orange: { icon: "text-orange-400",  activeBg: "bg-orange-500/10",activeText: "text-orange-300",hoverBg: "hover:bg-orange-500/10",accent: "bg-orange-500" },
  rose:   { icon: "text-rose-400",    activeBg: "bg-rose-500/10",  activeText: "text-rose-300",  hoverBg: "hover:bg-rose-500/10",  accent: "bg-rose-500" },
  amber:  { icon: "text-amber-400",   activeBg: "bg-amber-500/10", activeText: "text-amber-300", hoverBg: "hover:bg-amber-500/10", accent: "bg-amber-500" },
  emerald:{ icon: "text-emerald-400", activeBg: "bg-emerald-500/10",activeText: "text-emerald-300",hoverBg: "hover:bg-emerald-500/10",accent: "bg-emerald-500" },
  cyan:   { icon: "text-cyan-400",    activeBg: "bg-cyan-500/10",  activeText: "text-cyan-300",  hoverBg: "hover:bg-cyan-500/10",  accent: "bg-cyan-500" },
  pink:   { icon: "text-pink-400",    activeBg: "bg-pink-500/10",  activeText: "text-pink-300",  hoverBg: "hover:bg-pink-500/10",  accent: "bg-pink-500" },
  slate:  { icon: "text-slate-500",   activeBg: "bg-slate-800",   activeText: "text-slate-300", hoverBg: "hover:bg-slate-800/60", accent: "bg-slate-400" },
  brand:  { icon: "text-brand-400",   activeBg: "bg-brand-500/10", activeText: "text-brand-300", hoverBg: "hover:bg-brand-500/10", accent: "bg-brand-500" },
};

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  color?: NavItemColor;
}

export interface DashboardNavSectionGroup {
  title: string;
  items: DashboardNavItem[];
}

/**
 * Mobile-only (`lg:hidden`) navigation for the dashboard. Renders a hamburger
 * trigger plus a portalled slide-out drawer that mirrors the desktop sidebar,
 * so phone/tablet users can reach every dashboard route and log out.
 */
export function DashboardMobileNav({
  logoSrc,
  logoDarkSrc,
  logoAlt,
  mainNavSections,
  settingsNav,
  footer,
  dashboardHref,
  user,
  isStudent,
  onLogout,
}: {
  logoSrc: string;
  logoDarkSrc?: string;
  logoAlt: string;
  mainNavSections: DashboardNavSectionGroup[];
  settingsNav: DashboardNavItem[];
  footer?: ReactNode;
  dashboardHref: string;
  user: {
    firstName: string;
    lastName: string;
    initials: string;
    avatar: string | null;
    email: string | null;
    phone: string | null;
  };
  isStudent: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const renderLink = (item: DashboardNavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const color = item.color ?? "brand";
    const colors = isActive ? colorMap[color] : undefined;
    const darkColors = isActive ? darkColorMap[color] : undefined;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
          isActive
            ? `${colors?.activeBg} ${colors?.activeText} dark:${darkColors?.activeBg} dark:${darkColors?.activeText}`
            : `text-slate-500 ${colorMap[color].hoverBg} hover:text-slate-900 dark:text-slate-400 dark:${darkColorMap[color].hoverBg} dark:hover:text-slate-100`
        }`}
      >
        {isActive && (
          <span className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full ${colors?.accent ?? colorMap[color].accent}`} />
        )}
        <span className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center [&>svg]:h-[20px] [&>svg]:w-[20px] transition-colors ${
          isActive
            ? colors?.icon
            : `${colorMap[color].icon} opacity-60 group-hover:opacity-100`
        }`}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <button
        type="button"
        className="lg:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted &&
        createPortal(
          <>
            <div
              className={`lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <div
              className={`lg:hidden fixed inset-y-0 left-0 z-[70] flex w-[80%] max-w-xs flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
                <Link href="/" aria-label={logoAlt}>
                  <SiteLogo
                    lightSrc={logoSrc}
                    darkSrc={logoDarkSrc}
                    alt={logoAlt}
                    width={140}
                    height={40}
                    className="h-9 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {mainNavSections.map((section) => (
                  <div key={section.title} className="mb-2">
                    <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 first:mt-0 dark:text-slate-600">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">{section.items.map(renderLink)}</div>
                  </div>
                ))}

                {settingsNav.length > 0 && (
                  <div className="mb-2">
                    <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 dark:text-slate-600">
                      SETTINGS
                    </p>
                    <div className="space-y-0.5">{settingsNav.map(renderLink)}</div>
                  </div>
                )}
              </nav>

              <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                {footer}

                <div className="rounded-2xl bg-gradient-to-r from-brand-400 to-brand-600 p-[1.5px]">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 dark:bg-slate-900">
                    <Link
                      href={dashboardHref}
                      onClick={() => setOpen(false)}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user.avatar ?? ""} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                          {user.email ?? user.phone ?? (isStudent ? "Student" : "Guest")}
                        </p>
                      </div>
                    </Link>

                    <form action={onLogout}>
                      <button
                        type="submit"
                        aria-label="Logout"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-red-500/40 dark:hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
