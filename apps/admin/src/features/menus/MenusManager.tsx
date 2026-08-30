"use client";

import { useState, useTransition } from "react";
import {
  Plus, PencilSimple, Trash, ArrowUp, ArrowDown, X,
  ArrowSquareOut, Eye, EyeSlash, LinkSimple, SpinnerGap, DotsSixVertical, Monitor,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { menusAdminApiBrowser } from "./api/browser";
import {
  MENU_KEYS, MENU_META, PAGE_OPTIONS,
  type MenuItem, type MenusGrouped, type MenuKey,
} from "./types";

const CUSTOM = "__custom__";

export function MenusManager({ initial }: { initial: MenusGrouped }) {
  const [menus, setMenus] = useState<MenusGrouped>(initial);
  const [active, setActive] = useState<MenuKey>("navbar");
  const [isPending, startTransition] = useTransition();

  // ── Add / edit modal state ──────────────────────────────────────────────────
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"page" | "custom">("page");
  const [url, setUrl] = useState("/");
  const [openInNewTab, setOpenInNewTab] = useState(false);

  // ── Drag-and-drop reorder state ─────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const items = menus[active];

  function patchMenu(key: MenuKey, next: MenuItem[]) {
    setMenus((m) => ({ ...m, [key]: next }));
  }

  function openAdd() {
    setEditing(null);
    setLabel("");
    setMode("page");
    setUrl(PAGE_OPTIONS[0]!.url);
    setOpenInNewTab(false);
    setFormOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setLabel(item.label);
    const known = PAGE_OPTIONS.some((p) => p.url === item.url);
    setMode(known ? "page" : "custom");
    setUrl(item.url);
    setOpenInNewTab(item.openInNewTab);
    setFormOpen(true);
  }

  function save() {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    if (!trimmedLabel) { toast.error("Label is required"); return; }
    if (!trimmedUrl) { toast.error("Link is required"); return; }

    const isExternal = /^https?:\/\//i.test(trimmedUrl);

    startTransition(async () => {
      if (editing) {
        const res = await menusAdminApiBrowser
          .update(editing.id, { label: trimmedLabel, url: trimmedUrl, isExternal, openInNewTab })
          .catch(() => null);
        if (!res) { toast.error("Failed to save link"); return; }
        patchMenu(active, items.map((it) => (it.id === editing.id ? res.data : it)));
        toast.success("Link updated");
      } else {
        const res = await menusAdminApiBrowser
          .create({ menu: active, label: trimmedLabel, url: trimmedUrl, isExternal, openInNewTab })
          .catch(() => null);
        if (!res) { toast.error("Failed to add link"); return; }
        patchMenu(active, [...items, res.data]);
        toast.success("Link added");
      }
      setFormOpen(false);
    });
  }

  function toggle(item: MenuItem) {
    startTransition(async () => {
      const res = await menusAdminApiBrowser.toggle(item.id).catch(() => null);
      if (!res) { toast.error("Failed to update link"); return; }
      patchMenu(active, items.map((it) => (it.id === item.id ? res.data : it)));
      toast.success(res.data.isActive ? "Link shown" : "Link hidden");
    });
  }

  function remove(item: MenuItem) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await menusAdminApiBrowser.delete(item.id).catch(() => null);
      if (!res) { toast.error("Failed to delete link"); return; }
      patchMenu(active, items.filter((it) => it.id !== item.id));
      toast.success("Link deleted");
    });
  }

  function reorderTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    const prev = items;
    patchMenu(active, next); // optimistic
    startTransition(async () => {
      const res = await menusAdminApiBrowser
        .reorder(next.map((it, i) => ({ id: it.id, order: i })))
        .catch(() => null);
      if (!res) {
        patchMenu(active, prev); // revert
        toast.error("Failed to reorder");
      }
    });
  }

  function move(index: number, dir: -1 | 1) {
    reorderTo(index, index + dir);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex !== null) reorderTo(dragIndex, targetIndex);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Menu Link"
        message={deleteTarget ? <>Delete <strong>"{deleteTarget.label}"</strong> from this menu? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          {/* Menu tabs */}
          <div className="mb-4 flex flex-wrap gap-2 sm:mb-5">
            {MENU_KEYS.map((key) => {
              const isActive = key === active;
              const count = menus[key].length;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isActive
                      ? "border-brand-200 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {MENU_META[key].label}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-brand-200 text-brand-800 dark:bg-brand-500/25 dark:text-brand-200"
                      : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active menu panel */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{MENU_META[active].label}</p>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">{MENU_META[active].description}</p>
              </div>
              <button
                onClick={openAdd}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Add link
              </button>
            </div>

            {items.length > 1 && (
              <p className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-slate-800 dark:text-gray-500 sm:px-5">
                <DotsSixVertical className="h-3 w-3" /> Drag the handle to reorder, or use the arrow buttons.
              </p>
            )}

            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {items.length === 0 && (
                <li className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/5">
                    <LinkSimple className="h-5 w-5 text-brand-500 dark:text-brand-300" />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No links in this menu yet. Click "Add link" to create one.
                  </p>
                </li>
              )}
              {items.map((item, i) => (
            <li
              key={item.id}
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
              onDragOver={(e) => { if (dragIndex !== null) { e.preventDefault(); setDragOverIndex(i); } }}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
              className={`list-item-in flex items-center gap-1.5 px-4 py-3.5 transition-all sm:gap-3 sm:px-5 ${item.isActive ? "" : "opacity-55"} ${
                dragIndex === i ? "opacity-40" : ""
              } ${dragOverIndex === i && dragIndex !== null && dragIndex !== i ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}
            >
              {/* Drag handle */}
              <div
                draggable
                onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                aria-label={`Drag to reorder ${item.label}`}
                title="Drag to reorder"
                className="hidden shrink-0 cursor-grab items-center justify-center rounded p-1 text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-gray-400 sm:flex"
              >
                <DotsSixVertical className="h-4 w-4" />
              </div>

              {/* Reorder */}
              <div className="flex shrink-0 flex-col">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || isPending}
                  aria-label="Move up"
                  title="Move up"
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-600 dark:hover:text-brand-400"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1 || isPending}
                  aria-label="Move down"
                  title="Move down"
                  className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-600 dark:hover:text-brand-400"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Label + url */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                  {item.isExternal && (
                    <span title="External link"><ArrowSquareOut className="h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500" /></span>
                  )}
                  {!item.isActive && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                      Hidden
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 truncate text-xs text-gray-400 dark:text-gray-500">
                  <LinkSimple className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.url}</span>
                  {item.openInNewTab && <span className="shrink-0 text-gray-300 dark:text-slate-600">· new tab</span>}
                </span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <button
                  onClick={() => toggle(item)}
                  disabled={isPending}
                  aria-label={item.isActive ? "Hide" : "Show"}
                  title={item.isActive ? "Hide" : "Show"}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-slate-800 dark:hover:text-gray-200 sm:h-8 sm:w-8"
                >
                  {item.isActive ? <Eye className="h-4 w-4" /> : <EyeSlash className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  disabled={isPending}
                  aria-label="Edit"
                  title="Edit"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 sm:h-8 sm:w-8"
                >
                  <PencilSimple className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  disabled={isPending}
                  aria-label="Delete"
                  title="Delete"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:h-8 sm:w-8"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-4">
          <MenuPreview menuKey={active} items={items} />
        </div>
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <div
          className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm dark:bg-black/60 sm:p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel-in flex h-full w-full flex-col bg-white shadow-xl dark:bg-slate-900 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-3.5">
              <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {editing ? "Edit link" : "Add link"} · {MENU_META[active].label}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {/* Label */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                <input
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. About Us"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
                />
              </div>

              {/* Link target */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Links to</label>
                <select
                  value={mode === "custom" ? CUSTOM : url}
                  onChange={(e) => {
                    if (e.target.value === CUSTOM) {
                      setMode("custom");
                      setUrl("");
                    } else {
                      setMode("page");
                      setUrl(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
                >
                  {PAGE_OPTIONS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label} ({p.url})
                    </option>
                  ))}
                  <option value={CUSTOM}>Custom URL…</option>
                </select>

                {mode === "custom" && (
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com or /custom-path"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
                  />
                )}
              </div>

              {/* Open in new tab */}
              <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-600"
                />
                Open in a new tab
              </label>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:justify-end sm:px-5 sm:py-3.5">
              <button
                onClick={() => setFormOpen(false)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 sm:w-auto sm:border-0 sm:bg-transparent sm:hover:bg-gray-100 sm:dark:bg-transparent sm:dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
              >
                {isPending ? <SpinnerGap className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Add link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live preview ─────────────────────────────────────────────────────────────

const FOOTER_KEYS: MenuKey[] = ["footer_company", "footer_others"];

function MenuPreview({ menuKey, items }: { menuKey: MenuKey; items: MenuItem[] }) {
  const visible = items.filter((it) => it.isActive);
  const isFooter = FOOTER_KEYS.includes(menuKey);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800">
        <Monitor className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Preview</p>
      </div>

      <div className="p-4">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400 dark:border-slate-700 dark:text-gray-500">
            No visible links to preview yet.
          </p>
        ) : isFooter ? (
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800/50">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {MENU_META[menuKey].label.replace("Footer · ", "")}
            </p>
            <ul className="space-y-1.5">
              {visible.map((item) => (
                <li key={item.id} className="truncate text-sm text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-300">
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-xl bg-gray-50 p-4 dark:bg-slate-800/50">
            {visible.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm dark:bg-slate-900 dark:text-gray-200"
              >
                {item.label}
                {item.isExternal && <ArrowSquareOut className="h-3 w-3 text-gray-400 dark:text-gray-500" />}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          Approximate preview of {visible.length} visible link{visible.length !== 1 ? "s" : ""} in this menu. Actual site styling may vary.
        </p>
      </div>
    </div>
  );
}
