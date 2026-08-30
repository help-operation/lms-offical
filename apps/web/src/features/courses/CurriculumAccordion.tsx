"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle, FileText, Lock, Play, Clock } from "lucide-react";
import type { CurriculumModule } from "@/features/courses/api";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function LessonIcon({ type }: { type: string }) {
  if (type === "video") return <PlayCircle className="h-4 w-4 text-brand-400 shrink-0" />;
  if (type === "text") return <FileText className="h-4 w-4 text-blue-400 shrink-0" />;
  return <FileText className="h-4 w-4 text-gray-400 shrink-0" />;
}

interface Props {
  modules: CurriculumModule[];
}

export function CurriculumAccordion({ modules }: Props) {
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set([modules[0]?.id ?? -1]));

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll() { setOpenIds(new Set(modules.map((m) => m.id))); }
  function collapseAll() { setOpenIds(new Set()); }

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalSecs = modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.duration, 0), 0);
  const allOpen = openIds.size === modules.length;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
            <Play className="h-5 w-5 text-brand-500 fill-brand-500 dark:text-brand-400 dark:fill-brand-400" />
            Course Curriculum
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">
            {modules.length} sections · {totalLessons} lessons · {fmtDuration(totalSecs)} total
          </p>
        </div>
        <button
          onClick={allOpen ? collapseAll : expandAll}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors dark:text-brand-400 dark:hover:text-brand-300"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Modules */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {modules.map((mod) => {
          const isOpen = openIds.has(mod.id);
          const modDuration = mod.lessons.reduce((a, l) => a + l.duration, 0);
          const freeLessons = mod.lessons.filter((l) => l.isFree).length;

          return (
            <div key={mod.id}>
              {/* Module header */}
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left dark:hover:bg-gray-700/60"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 dark:text-gray-500 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{mod.title}</span>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      <span>{mod.lessons.length} lessons</span>
                      {modDuration > 0 && (
                        <>
                          <span>·</span>
                          <span>{fmtDuration(modDuration)}</span>
                        </>
                      )}
                      {freeLessons > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-brand-600 font-medium dark:text-brand-400">{freeLessons} free</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Lessons */}
              {isOpen && mod.lessons.length > 0 && (
                <div className="bg-gray-50/60 dark:bg-gray-900/40">
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 px-8 py-3 border-t border-gray-100/80 hover:bg-white/60 transition-colors dark:border-gray-700/60 dark:hover:bg-gray-800/60"
                    >
                      <LessonIcon type={lesson.type} />
                      <span className="flex-1 text-sm text-gray-700 min-w-0 truncate dark:text-gray-300">
                        {lesson.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.isFree ? (
                          <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full dark:text-brand-400 dark:bg-brand-500/15">
                            Preview
                          </span>
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                        )}
                        {lesson.duration > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 dark:text-gray-500">
                            <Clock className="h-3 w-3" />
                            {fmtDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
