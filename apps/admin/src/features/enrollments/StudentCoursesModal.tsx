"use client";

import { X, CheckCircle, CalendarBlank, BookOpen, Broadcast } from "@phosphor-icons/react";
import { formatDate } from "@/utils/table-export";
import type { AdminEnrollment } from "./types";

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400",
  completed: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
  suspended: "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400",
};

const avatarColors = ["bg-violet-500","bg-blue-500","bg-pink-500","bg-amber-500","bg-teal-500","bg-rose-500"];

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function hashColor(key: string) {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return avatarColors[sum % avatarColors.length];
}

export function StudentCoursesModal({
  student,
  onClose,
}: {
  student: AdminEnrollment;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
          >
            <X size={16} weight="bold" />
          </button>
          <div className="flex items-center gap-3">
            {student.userAvatar ? (
              <img src={student.userAvatar} alt="" className="h-12 w-12 rounded-full object-cover shrink-0 ring-2 ring-white/40" />
            ) : (
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 ring-2 ring-white/40 ${hashColor(student.key)}`}>
                {initials(student.userFirstName, student.userLastName)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {student.userFirstName} {student.userLastName}
              </h2>
              <p className="text-xs text-brand-100 mt-0.5 truncate">
                {student.userEmail ?? student.userPhone ?? "—"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center mt-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/15 text-white">
            {student.courseCount} {student.courseCount === 1 ? "course" : "courses"} joined
          </span>
        </div>

        {/* Course list */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-800/30">
          {student.courses.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400 dark:text-slate-500 gap-2">
              <p className="text-sm font-medium">No enrollments found</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {student.courses.map((c) => {
                const isLive = c.courseType === "live";
                return (
                  <div
                    key={`${c.courseType}-${c.id}`}
                    className={`flex items-center gap-3 rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 shadow-sm dark:shadow-none border-l-4 ${
                      isLive ? "border-l-brand-400 dark:border-l-brand border-gray-100 dark:border-slate-800" : "border-l-blue-400 border-gray-100 dark:border-slate-800"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isLive ? "bg-brand-100 dark:bg-brand/15 text-brand-600 dark:text-brand" : "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    }`}>
                      {isLive ? <Broadcast size={16} weight="fill" /> : <BookOpen size={16} weight="fill" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {c.courseTitle}
                        </p>
                        {isLive && (
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-brand-100 dark:bg-brand/15 text-brand-600 dark:text-brand uppercase tracking-wide">
                            Live
                          </span>
                        )}
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${STATUS_STYLES[c.status] ?? "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                        <CalendarBlank size={11} weight="bold" className="text-amber-500 dark:text-amber-400" />
                        Enrolled {formatDate(c.enrolledAt)}
                      </p>
                    </div>

                    {c.status === "completed" && (
                      <CheckCircle size={18} weight="fill" className="text-blue-500 dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-brand-600 dark:text-brand hover:bg-brand-50 dark:hover:bg-brand/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
