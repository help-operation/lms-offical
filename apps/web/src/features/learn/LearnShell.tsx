import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

interface LearnShellProps {
  /** Target for the left icon-rail back chevron. */
  homeHref: string;
  /** Target for the header back chevron (e.g. the course page). */
  backHref: string;
  courseTitle: string;
  /** Pre-rendered desktop sidebar (e.g. <LearnSidebar />). */
  sidebar: ReactNode;
  /**
   * Mobile-only contents trigger + drawer (e.g. <LearnMobileSidebar />),
   * rendered in the header. The desktop `sidebar` is hidden below `md`, so this
   * is how phone/tablet users reach the lesson list.
   */
  mobileSidebar?: ReactNode;
  children: ReactNode;
}

/**
 * Shared immersive learning shell used by both recorded and live courses:
 * full-screen frame with a left icon rail, a contents sidebar slot, and a
 * main column (header + scrollable content). Responds to the site theme toggle.
 */
export function LearnShell({
  homeHref,
  backHref,
  courseTitle,
  sidebar,
  mobileSidebar,
  children,
}: LearnShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0a0a0f] dark:text-gray-200">
      {/* Left icon rail */}
      <nav className="hidden sm:flex w-14 flex-shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-4 dark:border-white/10 dark:bg-[#121217]">
        <Link
          href={homeHref}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </nav>

      {/* Contents sidebar */}
      {sidebar}

      {/* Main column */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center gap-2 border-b border-slate-200 px-4 sm:gap-3 sm:px-6 dark:border-white/10">
          <Link
            href={backHref}
            className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Back to course"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {mobileSidebar}
          <span className="flex-1 truncate text-sm font-medium text-slate-900 dark:text-gray-100">
            {courseTitle}
          </span>
          <ThemeToggle />
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
