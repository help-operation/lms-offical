"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";

export function toSlug(t: string) {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export function Lbl({ text, req }: { text: string; req?: boolean }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {text}
      {req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

/** Optional reorder controls shown in a Panel header (move up/down + index badge). */
export interface PanelReorder {
  index?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Drag-and-drop handlers */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function Panel({
  title,
  children,
  open: defaultOpen = false,
  index,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
} & PanelReorder) {
  const [open, setOpen] = useState(defaultOpen);
  const reorderable = !!(onMoveUp || onMoveDown);
  const moveBtn =
    "flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500";
  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-all ${
        isDragOver ? "border-brand-500 ring-2 ring-brand-200" : "border-gray-200"
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center">
        {draggable && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="flex items-center px-1.5 py-3 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 min-w-0 flex items-center justify-between px-3 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            {index != null && (
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 shrink-0">
                {index}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-800 truncate">{title}</span>
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          )}
        </button>
        {reorderable && (
          <div className="flex items-center gap-1 pl-1 pr-2">
            <button type="button" title="Move up" disabled={!canMoveUp} onClick={onMoveUp} className={moveBtn}>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="Move down" disabled={!canMoveDown} onClick={onMoveDown} className={moveBtn}>
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">{children}</div>
      )}
    </div>
  );
}

export function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium mt-1"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

export function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-red-500 hover:text-red-600 transition-colors shrink-0"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
