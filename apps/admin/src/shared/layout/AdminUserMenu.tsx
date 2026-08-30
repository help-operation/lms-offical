"use client";

import { Gear, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formLogoutAction } from "@/features/auth/actions/auth.actions";

interface Props {
  userName: string;
  userInitial: string;
  role: string;
}

export function AdminUserMenu({ userName, userInitial, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{userName}</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-300 mt-0.5 capitalize">{role.toLowerCase().replace("_", " ")}</p>
        </div>
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-sm font-bold text-white shadow-md shadow-brand/25 ring-2 ring-white dark:ring-slate-900">
            {userInitial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-slate-900" />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-300 capitalize">{role.toLowerCase().replace("_", " ")}</p>
          </div>

          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Gear size={16} weight="fill" className="text-gray-400 dark:text-slate-400" />
            Settings
          </Link>

          <form action={formLogoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <SignOut size={16} weight="fill" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
