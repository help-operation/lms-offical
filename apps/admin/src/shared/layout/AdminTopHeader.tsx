"use client";

import { MagnifyingGlass, List } from "@phosphor-icons/react";
import { useSidebar } from "./SidebarContext";
import { AdminNotificationsBell } from "./AdminNotificationsBell";
import { AdminThemeToggle } from "./AdminThemeToggle";
import { AdminUserMenu } from "./AdminUserMenu";

interface Props {
  userName: string;
  userInitial: string;
  role: string;
}

export function AdminTopHeader({ userName, userInitial, role }: Props) {
  const { openMobile } = useSidebar();

  return (
    <header className="flex h-[70px] items-center gap-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Mobile hamburger — visible only on small screens */}
      <button
        onClick={openMobile}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-200 shrink-0 sm:hidden"
        title="Toggle sidebar"
      >
        <List size={18} weight="bold" />
      </button>

      {/* Greeting */}
      <div className="flex items-center gap-3.5 shrink-0">
        <p className="hidden md:block text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
          Welcome back, <span className="text-brand">{userName}!</span>
        </p>
      </div>

      {/* Search — centered in the remaining space */}
      <div className="flex flex-1 justify-center">
        <div className="group flex w-full max-w-sm items-center gap-2.5 rounded-full bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 px-4 py-2.5 transition-all duration-200 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-brand-300 dark:focus-within:border-brand/50 focus-within:shadow-[0_0_0_4px_rgba(166,77,255,0.08)]">
          <MagnifyingGlass
            size={15}
            weight="bold"
            className="text-black dark:text-white group-focus-within:text-brand-500 dark:group-focus-within:text-brand transition-colors shrink-0"
          />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-slate-400 shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-2.5 shrink-0">
        <AdminThemeToggle />

        {/* Notification bell */}
        <AdminNotificationsBell />

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-slate-700 to-transparent mx-1" />

        {/* User avatar + dropdown */}
        <AdminUserMenu userName={userName} userInitial={userInitial} role={role} />
      </div>
    </header>
  );
}
