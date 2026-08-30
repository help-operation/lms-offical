"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { RECORDED_TEMPLATES } from "./recorded-templates";

const TAG_COLORS: Record<string, string> = {
  Premium: "bg-amber-50 text-amber-600",
  Modern: "bg-emerald-50 text-emerald-600",
};

const PREVIEW_BG: Record<string, string> = {
  standard: "bg-indigo-50",
  elevate: "bg-slate-900",
};

export function RecordedCourseTemplatePicker() {
  const router = useRouter();

  function handleSelect(tpl: (typeof RECORDED_TEMPLATES)[number]) {
    router.push(`/admin/courses/new/${tpl.id}`);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/admin/courses")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pick a landing page design for your course. You can edit everything after.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {RECORDED_TEMPLATES.map((tpl) => {
          const bgCls = PREVIEW_BG[tpl.id] ?? "bg-slate-900";
          return (
            <button
              key={tpl.id}
              onClick={() => handleSelect(tpl)}
              className="group text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-500 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
            >
              {/* Mini wireframe preview */}
              <div className={`${bgCls} p-3 space-y-1.5 relative`}>
                {tpl.previewSections.map((s, i) => (
                  <div key={i} className={`rounded ${s.color} ${s.h} w-full opacity-80`} />
                ))}
                {tpl.tags.includes("Premium") && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-500 transition-colors">
                    {tpl.name}
                  </h3>
                  <CheckCircle2 className="h-5 w-5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}

        {/* "More coming soon" placeholder */}
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 text-gray-400 dark:text-gray-500">
          <Sparkles className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">More templates coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
