"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: { match: (path: string) => boolean; title: string; description?: string }[] = [
  {
    match: (p) => p === "/student/dashboard" || p === "/guest/dashboard",
    title: "Dashboard",
  },
  {
    match: (p) => p.startsWith("/student/courses"),
    title: "My Courses",
    description: "Everything you're enrolled in — live batches and self-paced courses.",
  },
  {
    match: (p) => p.startsWith("/student/certificates"),
    title: "My Certificates",
  },
  {
    match: (p) => p.startsWith("/student/notes"),
    title: "My Notes",
    description: "Everything you've jotted down across your lessons, in one place.",
  },
  {
    match: (p) => p.startsWith("/student/payment-history"),
    title: "Payment History",
    description: "A record of all your course payments and invoices.",
  },
  {
    match: (p) => p.startsWith("/student/support"),
    title: "Support",
    description: "Get help with your courses, account, or billing.",
  },
  {
    match: (p) => p.startsWith("/dashboard/settings"),
    title: "Settings",
    description: "Manage your account, security and preferences.",
  },
];

export function DashboardPageHeading({ isStudent }: { isStudent: boolean }) {
  const pathname = usePathname();
  const page = PAGE_TITLES.find((p) => p.match(pathname));

  return (
    <div>
      <p className="text-sm font-medium text-brand">
        {isStudent ? "Student Portal" : "Guest Portal"}
      </p>
      <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">
        {page?.title ?? "Dashboard"}
      </h1>
      {page?.description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{page.description}</p>
      )}
    </div>
  );
}
