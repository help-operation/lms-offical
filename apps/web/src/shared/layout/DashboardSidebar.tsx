"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { SidebarNavLink } from "@/shared/layout/SidebarNavLink";
import { useSidebar } from "@/shared/layout/SidebarContext";
import {
  guestNavItems,
  studentNavSections,
  type DashboardNavSection,
  type NavItemColor,
} from "@/shared/layout/dashboard-nav";
import { SiteLogo } from "@/shared/components/SiteLogo";

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
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-slate-100 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:flex ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      <div className="flex h-full shrink-0 flex-col overflow-y-auto">
        {/* Logo + Toggle */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100/80 px-4 dark:border-slate-800/80">
          {!collapsed && (
            <Link href="/" className="min-w-0 flex-1">
              <SiteLogo
                lightSrc={logoSrc}
                darkSrc={logoDarkSrc}
                alt={logoAlt}
                width={140}
                height={40}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            {collapsed ? (
              <PanelLeft className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {isStudent
            ? studentNavSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  section={section}
                  pathname={pathname}
                  collapsed={collapsed}
                />
              ))
            : (
              <GuestNavSection
                items={guestNavItems}
                pathname={pathname}
                collapsed={collapsed}
              />
            )
          }
        </nav>

        {/* Bottom: contact card + user profile */}
        <div className="border-t border-slate-100/80 p-3 dark:border-slate-800/80">
          {!collapsed && contactCard}

          {/* User card */}
          {collapsed ? (
            <Link href={dashboardHref} className="flex justify-center py-2">
              <Avatar className="h-9 w-9 ring-2 ring-slate-100 dark:ring-slate-800">
                <AvatarImage src={user.avatar ?? ""} />
                <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-red-500/40 dark:hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  section,
  pathname,
  collapsed,
}: {
  section: DashboardNavSection;
  pathname: string;
  collapsed: boolean;
}) {
  const hasActive = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  if (collapsed) {
    return (
      <div className="mb-2">
        {section.items.map((item) => (
          <CollapsedNavItem
            key={item.href}
            item={item}
            pathname={pathname}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 first:mt-0 dark:text-slate-600">
        {section.title}
      </p>
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <FullNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}

function FullNavItem({
  item,
  pathname,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number; color: NavItemColor };
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  const colors = isActive ? colorMap[item.color] : undefined;
  const darkColors = isActive ? darkColorMap[item.color] : undefined;

  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
        isActive
          ? `${colors?.activeBg} ${colors?.activeText} dark:${darkColors?.activeBg} dark:${darkColors?.activeText}`
          : `text-slate-500 ${colorMap[item.color].hoverBg} hover:text-slate-900 dark:text-slate-400 dark:${darkColorMap[item.color].hoverBg} dark:hover:text-slate-100`
      }`}
    >
      {isActive && (
        <span className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full ${colorMap[item.color].accent}`} />
      )}
      <span className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center [&>svg]:h-[20px] [&>svg]:w-[20px] transition-colors ${
        isActive
          ? colors?.icon
          : `${colorMap[item.color].icon} opacity-60 group-hover:opacity-100`
      }`}>
        <Icon />
      </span>
      <span className="truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

function CollapsedNavItem({
  item,
  pathname,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number; color: NavItemColor };
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  const colors = isActive ? colorMap[item.color] : undefined;
  const darkColors = isActive ? darkColorMap[item.color] : undefined;
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 400);
  };
  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative flex justify-center py-0.5">
      <Link
        href={item.href}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
          isActive
            ? `${colors?.activeBg} dark:${darkColors?.activeBg}`
            : `text-slate-500 ${colorMap[item.color].hoverBg} dark:text-slate-400 dark:${darkColorMap[item.color].hoverBg}`
        }`}
        aria-label={item.label}
      >
        {isActive && (
          <span className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full ${
            item.color === "brand" ? "bg-brand-500" : `bg-${item.color}-500`
          }`} />
        )}
        <span className={`flex h-[20px] w-[20px] items-center justify-center [&>svg]:h-[20px] [&>svg]:w-[20px] transition-colors ${
          isActive
            ? colors?.icon
            : `${colorMap[item.color].icon} opacity-60 group-hover:opacity-100`
        }`}>
          <Icon />
        </span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-slate-700"
        >
          {item.label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
        </div>
      )}
    </div>
  );
}

function GuestNavSection({
  items,
  pathname,
  collapsed,
}: {
  items: typeof guestNavItems;
  pathname: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return (
      <div className="mb-2">
        {items.map((item) => (
          <CollapsedNavItem
            key={item.href}
            item={item}
            pathname={pathname}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <p className="mb-1.5 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 first:mt-0 dark:text-slate-600">
        MAIN MENU
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <FullNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}
