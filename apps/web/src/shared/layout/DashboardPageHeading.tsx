"use client";

import { usePathname } from "next/navigation";
import { TypingText } from "@/shared/layout/TypingText";

const PAGE_TITLES: { match: (path: string) => boolean; title: string; description?: string }[] = [
  {
    match: (p) => p === "/student/dashboard",
    title: "Student Dashboard",
  },
  {
    match: (p) => p === "/guest/dashboard",
    title: "Dashboard",
  },
  {
    match: (p) => p.startsWith("/student/courses"),
    title: "My Courses",
    description: "Everything you're enrolled in — live batches and self-paced courses.",
  },
  {
    match: (p) => p.startsWith("/student/classes"),
    title: "Classes & Schedule",
    description: "View your upcoming live classes and schedule.",
  },
  {
    match: (p) => p.startsWith("/student/progress"),
    title: "My Progress",
    description: "Track your learning progress across all enrolled courses.",
  },
  {
    match: (p) => p.startsWith("/student/assignments"),
    title: "Assignments",
    description: "View and submit your course assignments.",
  },
  {
    match: (p) => p.startsWith("/student/quizzes"),
    title: "Quizzes & Exams",
    description: "Take quizzes and track your exam results.",
  },
  {
    match: (p) => p.startsWith("/student/certificates"),
    title: "My Certificates",
    description: "Your earned credentials and certificates.",
  },
  {
    match: (p) => p.startsWith("/student/payment-history"),
    title: "Payment History",
    description: "A record of all your course payments and invoices.",
  },
  {
    match: (p) => p.startsWith("/student/notifications"),
    title: "Notifications",
    description: "Stay updated with your latest notifications.",
  },
  {
    match: (p) => p.startsWith("/student/messages"),
    title: "Messages",
    description: "Communicate with instructors and support.",
  },
  {
    match: (p) => p.startsWith("/student/support"),
    title: "Support",
    description: "Get help with your courses, account, or billing.",
  },
  {
    match: (p) => p.startsWith("/dashboard/profile"),
    title: "My Profile",
    description: "Manage your personal information.",
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
  const isDashboard = pathname === "/student/dashboard" || pathname === "/guest/dashboard";

  return (
    <div>
      {!isDashboard && (
        <p className="text-sm font-medium text-brand">
          {isStudent ? "Student Dashboard" : "Guest Dashboard"}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">
        {page?.title ?? "Dashboard"}
      </h1>
      {isDashboard && isStudent && (
        <p className="mt-1 h-5 text-sm">
          <TypingText />
        </p>
      )}
      {page?.description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{page.description}</p>
      )}
    </div>
  );
}
