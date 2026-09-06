"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { SidebarNavLink } from "@/shared/layout/SidebarNavLink";
import { useSidebar } from "@/shared/layout/SidebarContext";
import {
  guestNavItems,
  studentNavSections,
  type DashboardNavSection,
} from "@/shared/layout/dashboard-nav";
import { SiteLogo } from "@/shared/components/SiteLogo";

export function DashboardSidebar({
  logoSrc,
  logoDarkSrc,
  logoAlt,
  isStudent,
  dashboardHref,
  contactCard,
  user,
  onLogout,
}: {
  logoSrc: string;
  logoDarkSrc?: string;
  logoAlt: string;
  isStudent: boolean;
  dashboardHref: string;
  contactCard: ReactNode;
  user: {
    firstName: string;
    lastName: string;
    initials: string;
    avatar: string | null;
    email: string | null;
    phone: string | null;
  };
  onLogout: () => void;
}) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-slate-100 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 lg:flex ${
        collapsed ? "w-0" : "w-64"
      }`}
    >
      <div className="flex h-full w-64 shrink-0 flex-col overflow-y-auto">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <div className="flex h-16 items-center px-6">
            <SiteLogo
              lightSrc={logoSrc}
              darkSrc={logoDarkSrc}
              alt={logoAlt}
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
        </Link>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {isStudent
            ? studentNavSections.map((section) => (
                <SidebarSection key={section.title} section={section} pathname={pathname} />
              ))
            : <GuestNavSection items={guestNavItems} pathname={pathname} />
          }
        </nav>

        {/* Bottom: contact card + user profile */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          {contactCard}

          {/* User card */}
          <div className="rounded-2xl bg-gradient-to-r from-brand-400 to-brand-600 p-[1.5px]">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 dark:bg-slate-900">
              <Link href={dashboardHref} className="flex min-w-0 flex-1 items-center gap-2.5">
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
    </aside>
  );
}

function SidebarSection({ section, pathname }: { section: DashboardNavSection; pathname: string }) {
  const isExpanded = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="mb-1">
      <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 first:mt-0 dark:text-slate-500">
        {section.title}
      </p>
      <div className="space-y-0.5">
        {section.items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarNavLink key={item.href} href={item.href} icon={<Icon />}>
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </SidebarNavLink>
          );
        })}
      </div>
    </div>
  );
}

function GuestNavSection({ items, pathname }: { items: typeof guestNavItems; pathname: string }) {
  return (
    <div className="mb-1">
      <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 first:mt-0 dark:text-slate-500">
        MAIN MENU
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarNavLink key={item.href} href={item.href} icon={<Icon />}>
              {item.label}
            </SidebarNavLink>
          );
        })}
      </div>
    </div>
  );
}
