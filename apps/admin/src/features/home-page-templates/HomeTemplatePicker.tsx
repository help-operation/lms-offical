"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, PencilSimple, SpinnerGap, Sparkle, X } from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { HOME_TEMPLATES, type HomeTemplateDefinition } from "./registry";
import { updateHomeTemplateAction, updateHomeTemplateColorAction } from "./actions";

const TAG_COLORS: Record<string, string> = {
  Popular: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  "Full-featured": "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  New: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  "Course-first": "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  Minimal: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  Lightweight: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
};

const HEX_RE = /^#([0-9a-f]{6})$/i;

interface Props {
  templates: HomeTemplateDefinition[];
  initialSelected: string;
  initialColors: Record<string, string>;
}

export function HomeTemplatePicker({ templates = HOME_TEMPLATES, initialSelected, initialColors }: Props) {
  const [selected, setSelected] = useState(initialSelected);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [colors, setColors] = useState<Record<string, string>>(initialColors);
  const [colorPendingId, setColorPendingId] = useState<string | null>(null);
  const [isColorPending, startColorTransition] = useTransition();

  function handleSelect(templateId: string) {
    if (templateId === selected || isPending) return;
    setPendingId(templateId);
    startTransition(async () => {
      const res = await updateHomeTemplateAction(templateId);
      if (res.success) {
        setSelected(templateId);
        toast.success("Home page template updated");
      } else {
        toast.error(res.message ?? "Failed to update template");
      }
      setPendingId(null);
    });
  }

  function handleColorChange(templateId: string, color: string) {
    setColors((p) => ({ ...p, [templateId]: color }));
    setColorPendingId(templateId);
    startColorTransition(async () => {
      const res = await updateHomeTemplateColorAction(templateId, color);
      if (res.success) {
        toast.success("Template color updated");
      } else {
        toast.error(res.message ?? "Failed to update color");
      }
      setColorPendingId(null);
    });
  }

  function handleClearColor(templateId: string) {
    setColors((p) => {
      const next = { ...p };
      delete next[templateId];
      return next;
    });
    setColorPendingId(templateId);
    startColorTransition(async () => {
      const res = await updateHomeTemplateColorAction(templateId, "");
      if (res.success) {
        toast.success("Reset to default color");
      } else {
        toast.error(res.message ?? "Failed to reset color");
      }
      setColorPendingId(null);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {templates.map((tpl) => {
        const active = selected === tpl.id;
        const saving = isPending && pendingId === tpl.id;
        const color = colors[tpl.id] ?? "";
        const colorSaving = isColorPending && colorPendingId === tpl.id;
        return (
          <div
            key={tpl.id}
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-sm ring-1 ring-black/[0.03] transition-all duration-300 dark:bg-slate-900 dark:ring-white/[0.03] ${
              active
                ? `${tpl.accent.border} shadow-lg ${tpl.accent.shadow} ${tpl.accent.ring} ring-2`
                : `border-gray-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 ${tpl.accent.hoverBorder}`
            }`}
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full shrink-0 ${tpl.accent.badge} ${active ? "opacity-100" : "opacity-0 transition-opacity duration-300 group-hover:opacity-60"}`} />

            {/* Mini browser-chrome preview — fixed height so every card's preview matches */}
            <div className={`relative h-56 overflow-hidden ${tpl.previewBg} dark:bg-slate-950/40`}>
              <div className="flex items-center gap-1.5 px-3 pt-2.5">
                <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-700" />
                <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-700" />
                <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-700" />
              </div>
              <div className="flex h-[calc(100%-1.375rem)] flex-col justify-center gap-1.5 p-3 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
                {tpl.previewSections.map((s, i) => (
                  <div key={i} className={`w-full shrink-0 rounded opacity-80 dark:opacity-60 ${s.color} ${s.h}`} />
                ))}
              </div>

              {active && (
                <span className={`absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-md ${tpl.accent.badge}`}>
                  <Check size={10} weight="bold" />
                  Active
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-semibold tracking-tight text-gray-900 dark:text-slate-100">{tpl.name}</h3>
              <p className="mt-1.5 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                {tpl.description}
              </p>
              <div className="mt-2.5 flex min-h-[1.375rem] flex-wrap gap-1">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Per-template color */}
              <div className="mt-3.5 rounded-xl border border-gray-100 bg-gray-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Template color
                </p>
                <div className="flex items-center gap-2">
                  <label className="relative shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={HEX_RE.test(color) ? color : tpl.accent.hex}
                      onChange={(e) => handleColorChange(tpl.id, e.target.value)}
                      className="h-7 w-9 cursor-pointer rounded-lg border border-gray-200 bg-transparent p-0.5 dark:border-slate-700"
                    />
                  </label>
                  <span className="flex-1 truncate font-mono text-[11px] text-gray-500 dark:text-slate-400">
                    {color || "Default palette"}
                  </span>
                  {colorSaving && <SpinnerGap size={12} className="animate-spin text-gray-400 dark:text-slate-500" />}
                  {color && !colorSaving && (
                    <button
                      onClick={() => handleClearColor(tpl.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                      title="Reset to default color"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <button
                  onClick={() => handleSelect(tpl.id)}
                  disabled={active || isPending}
                  className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${tpl.accent.button}`}
                >
                  {saving ? (
                    <SpinnerGap size={13} className="animate-spin" />
                  ) : active ? (
                    <Check size={13} weight="bold" />
                  ) : null}
                  {active ? "Active" : "Set active"}
                </button>
                <Link
                  href={tpl.editHref}
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition-colors dark:border-slate-700 dark:text-slate-300 ${tpl.accent.outlineHover}`}
                >
                  <PencilSimple size={13} weight="bold" />
                  Edit sections
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* "More templates coming soon" placeholder */}
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 p-6 text-center text-gray-400 transition-colors dark:border-slate-800 dark:text-slate-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800/60">
          <Sparkle size={22} className="text-gray-300 dark:text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">More templates coming soon</p>
        </div>
      </div>
    </div>
  );
}
