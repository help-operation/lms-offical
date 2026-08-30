"use client";

import Link from "next/link";
import { Lock, ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useLessonProgress } from "./LessonProgressContext";

export type LearnLessonType = "video" | "text" | "quiz" | "assignment";

export interface LearnSidebarLesson {
  id: number;
  title: string;
  type: LearnLessonType;
  href: string;
  duration?: number;
  isFree?: boolean;
  completed?: boolean;
  isLocked?: boolean;
}

export interface LearnSidebarModule {
  id: number;
  title: string;
  lessons: LearnSidebarLesson[];
}

export interface LearnSidebarProps {
  modules: LearnSidebarModule[];
  trackProgress?: boolean;
}

export function LearnSidebar(props: LearnSidebarProps) {
  return (
    <aside className="hidden md:flex w-72 flex-shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#121217]">
      <LearnSidebarContent {...props} />
    </aside>
  );
}

export function LearnSidebarContent({
  modules,
  trackProgress = false,
}: LearnSidebarProps) {
  const { completedIds } = useLessonProgress();
  const params = useParams();
  const currentLessonId = Number(params.lessonId);

  // Only one module is expanded at a time — defaults to whichever module
  // contains the active lesson, falling back to the first module.
  const [openModuleId, setOpenModuleId] = useState<number | null>(() => {
    const activeMod = modules.find((m) => m.lessons.some((l) => l.id === currentLessonId));
    return activeMod?.id ?? modules[0]?.id ?? null;
  });

  const allLessons = modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = trackProgress
    ? allLessons.filter((l) => completedIds.has(l.id)).length
    : 0;
  const progressPct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Progress header */}
      <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Curriculum
          </span>
          {trackProgress && totalLessons > 0 && (
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
              {completedCount}/{totalLessons}
            </span>
          )}
        </div>
        {trackProgress && totalLessons > 0 && (
          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-1 rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Lesson list */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((mod) => {
          const isOpen = mod.id === openModuleId;
          return (
          <div key={mod.id}>
            {/* Module section header (collapsible) */}
            <button
              type="button"
              onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
              className="flex w-full items-center justify-between border-y border-slate-200 bg-slate-100 px-5 py-2.5 text-left dark:border-white/10 dark:bg-white/5"
            >
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[#99A1AF]">
                {mod.title}
              </p>
              <ChevronDown
                className={`h-3.5 w-3.5 flex-shrink-0 text-[#99A1AF] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Lessons (animated open/close via grid-rows trick) */}
            <div
              className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                {mod.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId;
                  const locked = trackProgress && !!lesson.isLocked;
                  const completed = trackProgress && completedIds.has(lesson.id);

                  /* ── Active ── */
                  if (isActive) {
                    return (
                      <div key={lesson.id} className="px-3 py-1.5">
                        <div className="flex items-center gap-3 rounded-lg bg-brand-600 px-3 py-2.5">
                          <svg viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5 flex-shrink-0">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                          <span className="truncate text-xs font-bold uppercase tracking-wide text-white">
                            {lesson.title}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  /* ── Locked ── */
                  if (locked) {
                    return (
                      <div
                        key={lesson.id}
                        className="flex cursor-not-allowed items-center gap-3 px-5 py-2.5"
                      >
                        <Lock className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 dark:text-gray-600" />
                        <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-gray-400">
                          {lesson.title}
                        </span>
                      </div>
                    );
                  }

                  /* ── Completed ── */
                  if (completed) {
                    return (
                      <Link
                        key={lesson.id}
                        href={lesson.href}
                        className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-600">
                          <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="truncate text-xs font-bold uppercase tracking-wide">
                          {lesson.title}
                        </span>
                      </Link>
                    );
                  }

                  /* ── Default (unlocked, not started) ── */
                  return (
                    <Link
                      key={lesson.id}
                      href={lesson.href}
                      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-slate-300 dark:border-gray-600" />
                      <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-gray-400">
                        {lesson.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
