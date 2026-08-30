"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, X, ChevronDown } from "lucide-react";
import type { MenuLink } from "@/features/cms/api/menus";

/** Exact match for "/", otherwise the current path is this link or a subpath of it. */
function isActivePath(pathname: string, url: string, isExternal: boolean) {
  if (isExternal || !url) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

type DrawerUser = {
  name: string;
  roleLabel: string;
  initials: string;
  avatar: string | null;
  dashboardHref: string;
};

/** Renders a menu link as <Link> (internal) or <a> (external). */
function DrawerNavLink({
  item,
  onNavigate,
  className = "",
}: {
  item: MenuLink;
  onNavigate: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.url, item.isExternal);
  const base = `block border-l-2 py-2 pl-3 -ml-3 text-base font-medium transition-colors hover:text-brand-600 ${
    active
      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
      : "border-transparent text-gray-800 dark:text-gray-100"
  } ${className}`;

  if (item.isExternal) {
    return (
      <a
        href={item.url}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noreferrer" : undefined}
        className={base}
        onClick={onNavigate}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link
      href={item.url}
      target={item.openInNewTab ? "_blank" : undefined}
      className={base}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
}

export function MobileMenu({
  navigation,
  moreNav,
  companyLinks,
  otherLinks,
}: {
  navigation: MenuLink[];
  moreNav: MenuLink[];
  companyLinks: MenuLink[];
  otherLinks: MenuLink[];
}) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<DrawerUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Portals require the DOM, so only render the overlay after mount.
  useEffect(() => setMounted(true), []);

  // Fetch auth state the first time the drawer opens. Reading the cookie via a
  // same-origin route handler keeps it out of the public pages' static shell.
  useEffect(() => {
    if (!open || authLoaded) return;
    let active = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAuthLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [open, authLoaded]);

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

  const close = () => {
    setOpen(false);
    setMoreOpen(false);
    setCompanyOpen(false);
    setOtherOpen(false);
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        className="lg:hidden -ml-1 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="bg-ink-strong h-[2px] w-6 block transition-all duration-300" />
        <span className="bg-ink-strong h-[2px] w-6 block transition-all duration-300" />
        <span className="bg-ink-strong h-[2px] w-6 block transition-all duration-300" />
      </button>

      {/* Backdrop + drawer are portalled to <body> so they escape the
          header's backdrop-blur containing block and cover the viewport. */}
      {mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={close}
              aria-hidden="true"
            />

            {/* Slide-out drawer */}
            <div
              className={`lg:hidden fixed inset-y-0 left-0 z-[70] flex w-[80%] max-w-xs flex-col bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-xl transition-transform duration-300 ease-in-out ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              {/* Close button */}
              <div className="flex items-center justify-end px-5 pt-5">
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={close}
                  className="rounded-full p-1 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-6 pt-2">
                {navigation.map((item) => (
                  <DrawerNavLink key={item.id} item={item} onNavigate={close} />
                ))}

                {moreNav.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setMoreOpen((v) => !v)}
                      aria-expanded={moreOpen}
                      className="flex w-full items-center gap-1 py-2 text-base font-medium text-gray-800 dark:text-gray-100 transition-colors hover:text-brand-600"
                    >
                      More
                      <ChevronDown
                        className={`h-4 w-4 text-brand-600 transition-transform duration-200 ${
                          moreOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {moreOpen && (
                      <div className="pl-3">
                        {moreNav.map((item) => (
                          <DrawerNavLink
                            key={item.id}
                            item={item}
                            onNavigate={close}
                            className="text-sm text-gray-600"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer menu — Company links */}
                {companyLinks.length > 0 && (
                  <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setCompanyOpen((v) => !v)}
                      aria-expanded={companyOpen}
                      className="flex w-full items-center gap-1 py-2 text-base font-medium text-gray-800 dark:text-gray-100 transition-colors hover:text-brand-600"
                    >
                      Company
                      <ChevronDown
                        className={`h-4 w-4 text-brand-600 transition-transform duration-200 ${
                          companyOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {companyOpen && (
                      <div className="pl-3">
                        {companyLinks.map((item) => (
                          <DrawerNavLink
                            key={item.id}
                            item={item}
                            onNavigate={close}
                            className="text-sm text-gray-600"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer menu — Other links */}
                {otherLinks.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setOtherOpen((v) => !v)}
                      aria-expanded={otherOpen}
                      className="flex w-full items-center gap-1 py-2 text-base font-medium text-gray-800 dark:text-gray-100 transition-colors hover:text-brand-600"
                    >
                      Others
                      <ChevronDown
                        className={`h-4 w-4 text-brand-600 transition-transform duration-200 ${
                          otherOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {otherOpen && (
                      <div className="pl-3">
                        {otherLinks.map((item) => (
                          <DrawerNavLink
                            key={item.id}
                            item={item}
                            onNavigate={close}
                            className="text-sm text-gray-600"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cart — logged-in users only */}
                {user && (
                  <Link
                    href="/cart"
                    onClick={close}
                    aria-label="Cart"
                    className="inline-flex py-2 text-gray-700 dark:text-gray-300 transition-colors hover:text-brand-600"
                  >
                    <ShoppingBag className="h-6 w-6" />
                  </Link>
                )}
              </nav>

              {/* Footer: profile chip (authenticated) or auth actions. */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-5">
                {!authLoaded ? (
                  <div className="space-y-3">
                    <div className="h-11 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-700" />
                    <div className="h-11 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-700" />
                  </div>
                ) : user ? (
                  <Link
                    href={user.dashboardHref}
                    onClick={close}
                    className="flex items-center gap-3"
                  >
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-solid text-sm font-semibold text-white">
                        {user.initials}
                      </span>
                    )}
                    <span className="flex flex-col leading-tight">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{user.roleLabel}</span>
                    </span>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      onClick={close}
                      className="block w-full rounded-md bg-brand-solid px-4 py-2.5 text-center text-base font-semibold text-white shadow-md transition-colors hover:bg-brand-hover"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={close}
                      className="block w-full rounded-md border border-brand-solid px-4 py-2.5 text-center text-base font-semibold text-brand-solid transition-colors hover:bg-brand-50"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
