"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignOut,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import { GraduationCap } from "lucide-react";
import { formLogoutAction } from "@/features/auth/actions/auth.actions";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";
import { hasPermission } from "@/features/auth/permissions";
import { getTint } from "./sidebar-colors";
import { menuGroups } from "./admin-menu";

/**
 * Mobile overlay sidebar — slides in from the left on small screens.
 * Backdrop click or link click closes it.
 */
export function MobileSidebar({ permissions, siteName }: { permissions?: string[]; siteName?: string }) {
  const pathname = usePathname();
  const { mobileOpen, closeMobile } = useSidebar();

  const showAll = permissions === undefined;
  const groups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => showAll || !item.perm || hasPermission(permissions, item.perm),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    for (const group of groups) {
      if (group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        return group.label;
      }
    }
    return groups[0]?.label ?? null;
  });

  function toggleCategory(label: string) {
    setOpenCategory((prev) => (prev === label ? null : label));
  }

  // Lock body scroll when open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <div className="sm:hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobile}
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 dark:border-slate-800 px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-md shadow-brand/25 shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">{siteName || "Skillkoro"}</span>
          </div>
          <button
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            const categoryOpen = openCategory === group.label;
            const categoryActive = group.items.some(
              (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
            );

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleCategory(group.label)}
                  className={`relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    categoryActive
                      ? "bg-brand/8 text-brand dark:bg-brand/10"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {categoryActive && (
                    <span className="absolute -left-1 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
                  )}
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all ${
                    categoryActive ? `${group.color} shadow-sm` : getTint(group.color).tint
                  }`}>
                    <GroupIcon size={15} weight="fill" className={categoryActive ? "text-white" : getTint(group.color).icon} />
                  </span>
                  <span className="flex-1 text-left truncate">{group.label}</span>
                  <CaretRight
                    size={12}
                    weight="bold"
                    className={`shrink-0 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${categoryOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {categoryOpen && (
                  <ul className="mt-0.5 ml-4 pl-3 border-l-2 border-brand/15 dark:border-slate-700 space-y-0.5">
                    {group.items.map(({ href, label, icon: Icon, color }) => {
                      const active = pathname === href || pathname.startsWith(`${href}/`);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={closeMobile}
                            className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                              active
                                ? "bg-brand/8 text-brand dark:bg-brand/10"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            <span className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 transition-all ${
                              active ? `${color} shadow-sm` : getTint(color).tint
                            }`}>
                              <Icon size={13} weight="fill" className={active ? "text-white" : getTint(color).icon} />
                            </span>
                            <span className="flex-1 truncate">{label}</span>
                            {active && <CaretRight size={12} weight="bold" className="text-brand" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 dark:border-slate-800 p-3 shrink-0">
          <form action={formLogoutAction}>
            <button
              type="submit"
              className="group flex w-full items-center gap-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 shrink-0 group-hover:scale-105 transition-transform duration-200">
                <SignOut size={14} weight="fill" className="text-red-500 dark:text-red-400" />
              </span>
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
