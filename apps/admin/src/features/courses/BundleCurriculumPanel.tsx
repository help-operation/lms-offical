"use client";

import { Plus, Trash2 } from "lucide-react";

type BundleModule = { title: string; lessons: string[] };

export function BundleCurriculumPanel({
  value,
  onChange,
  header,
  onHeaderChange,
}: {
  value: BundleModule[];
  onChange: (v: BundleModule[]) => void;
  header?: { title?: string; moduleLabel?: string; courseTypeLabel?: string };
  onHeaderChange?: (h: { title?: string; moduleLabel?: string; courseTypeLabel?: string }) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800">Bundle Curriculum — কোর্স কারিকুলাম (Display)</h3>
      <p className="text-xs text-gray-500 mt-1">This only controls the landing page <strong>কোর্স কারিকুলাম</strong> section for the bundle. Real lessons are inside the selected courses.</p>
      {onHeaderChange && (
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Section Title — কোর্স কারিকুলাম</label>
            <input value={header?.title ?? ""} onChange={(e) => onHeaderChange({ ...header, title: e.target.value })} placeholder="কোর্স কারিকুলাম" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Module Label — 🎁 মডিউল</label>
              <input value={header?.moduleLabel ?? ""} onChange={(e) => onHeaderChange({ ...header, moduleLabel: e.target.value })} placeholder="মডিউল" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Course Type Label — 🎬 রেকর্ডেড কোর্স</label>
              <input value={header?.courseTypeLabel ?? ""} onChange={(e) => onHeaderChange({ ...header, courseTypeLabel: e.target.value })} placeholder="রেকর্ডেড কোর্স" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
        </div>
      )}
      <div className="mt-3 space-y-3">
        {value.map((mod, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={mod.title}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...next[i]!, title: e.target.value, lessons: next[i]!.lessons };
                  onChange(next);
                }}
                placeholder={`Module ${i + 1} title (e.g. Hello)`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5 pl-2">
              {mod.lessons.map((lesson, li) => (
                <div key={li} className="flex gap-2">
                  <input
                    value={lesson}
                    onChange={(e) => {
                      const next = [...value];
                      const lessons = [...next[i]!.lessons];
                      lessons[li] = e.target.value;
                      next[i] = { ...next[i]!, lessons };
                      onChange(next);
                    }}
                    placeholder={`Lesson ${li + 1}`}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...value];
                      next[i] = { ...next[i]!, lessons: next[i]!.lessons.filter((_, k) => k !== li) };
                      onChange(next);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next = [...value];
                  next[i] = { ...next[i]!, lessons: [...next[i]!.lessons, ""] };
                  onChange(next);
                }}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                + Add Lesson
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, { title: "", lessons: [] }])}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          <Plus className="h-3.5 w-3.5" /> Add Module
        </button>
      </div>
    </div>
  );
}
