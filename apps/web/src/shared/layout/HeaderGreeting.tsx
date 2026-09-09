"use client";

import { usePathname } from "next/navigation";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function HeaderGreeting() {
  const pathname = usePathname();
  const isDashboard = pathname === "/student/dashboard" || pathname === "/guest/dashboard";

  if (!isDashboard) return null;

  return (
    <div className="hidden min-w-0 flex-col lg:flex">
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
        {getGreeting()}!
      </p>
      <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
        Welcome back to your learning hub
      </p>
    </div>
  );
}
