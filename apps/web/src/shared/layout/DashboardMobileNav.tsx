"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { SiteLogo } from "@/shared/components/SiteLogo";

export interface DashboardNavItem {
  label: string;
  href: string;
  /** Pre-rendered icon element (icons can't cross the server/client boundary as components). */
  icon: ReactNode;
}

/**
 * Mobile-only (`lg:hidden`) navigation for the dashboard. Renders a hamburger
 * trigger plus a portalled slide-out drawer that mirrors the desktop sidebar,
 * so phone/tablet users can reach every dashboard route and log out.
 *
 * The desktop layout is a server component, so the nav items arrive with their
 * icons already rendered to elements and the logout server action is passed in.
 */
export function DashboardMobileNav({
  logoSrc,
  logoDarkSrc,
  logoAlt,
  mainNav,
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
  mainNav: DashboardNavItem[];
  settingsNav: DashboardNavItem[];
  /** Optional extra footer content (e.g. the guest contact card). */
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

  // Portals require the DOM, so only render the overlay after mount.
  useEffect(() => setMounted(true), []);

  // Close the drawer whenever the route changes (link tap inside the drawer).
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape and lock body scroll while the drawer is open.
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
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600" />
        )}
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger trigger */}
      <button
        type="button"
        className="lg:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop + drawer are portalled to <body> so they escape the header's
          backdrop-blur containing block and cover the viewport. */}
      {mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`lg:hidden fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out drawer */}
            <div
              className={`lg:hidden fixed inset-y-0 left-0 z-[70] flex w-[80%] max-w-xs flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
            >
              {/* Header: logo + close */}
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

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Main menu
                </p>
                <div className="space-y-0.5">{mainNav.map(renderLink)}</div>

                <p className="mb-2 mt-7 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Settings
                </p>
                <div className="space-y-0.5">{settingsNav.map(renderLink)}</div>
              </nav>

              {/* Footer: optional contact card + profile card */}
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-brand-300 hover:text-brand dark:border-slate-700 dark:text-slate-500"
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
