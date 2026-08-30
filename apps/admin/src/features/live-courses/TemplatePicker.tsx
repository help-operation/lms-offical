"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { TEMPLATES } from "./templates";

// Badge colour per tag
const TAG_COLORS: Record<string, string> = {
  Popular:         "bg-violet-50 text-violet-600",
  "Full-featured": "bg-violet-50 text-violet-600",
  New:             "bg-emerald-50 text-emerald-600",
  "High-converting": "bg-red-50 text-red-600",
  Medical:         "bg-blue-50 text-blue-600",
  Professional:    "bg-sky-50 text-sky-600",
};

// Preview bg colour per template
const PREVIEW_BG: Record<string, string> = {
  mastery: "bg-slate-900",
  sales:   "bg-gray-100",
  medical: "bg-blue-900",
};

export function TemplatePicker() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/admin/live-courses")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Live Courses
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Choose a Template</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick a landing page design. You can fill in the content in the next step.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => {
          const bgCls = PREVIEW_BG[tpl.id] ?? "bg-slate-900";
          return (
            <button
              key={tpl.id}
              onClick={() => router.push(`/admin/live-courses/new/${tpl.id}`)}
              className="group text-left bg-white border-2 border-gray-200 hover:border-brand-500 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
            >
              {/* Mini wireframe preview */}
              <div className={`${bgCls} p-3 space-y-1.5 relative`}>
                {tpl.previewSections.map((s, i) => (
                  <div key={i} className={`rounded ${s.color} ${s.h} w-full opacity-80`} />
                ))}

                {/* Badge overlay */}
                {tpl.tags.includes("Popular") && (
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                {tpl.tags.includes("New") && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {tpl.name}
                  </h3>
                  <CheckCircle2 className="h-5 w-5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-500"}`}
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
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 text-gray-400">
          <Sparkles className="h-8 w-8 text-gray-300" />
          <div>
            <p className="text-sm font-medium text-gray-500">More templates coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Minimal, Bootcamp styles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
