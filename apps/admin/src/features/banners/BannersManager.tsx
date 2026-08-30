"use client";

import { useState, useTransition } from "react";
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Eye, EyeOff,
  ImageIcon, ExternalLink, Clock,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import { bannersAdminApiBrowser } from "./api/browser";
import {
  PLACEMENTS, PLACEMENT_META,
  type Banner, type BannersGrouped, type Placement,
} from "./types";
import { useLocalization } from "@/shared/context/LocalizationContext";

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function BannersManager({ initial }: { initial: BannersGrouped }) {
  const [banners, setBanners] = useState<BannersGrouped>(initial);
  const [active, setActive] = useState<Placement>("popup");
  const { formatDate } = useLocalization();
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const items = banners[active];

  const patch = (next: Banner[]) => setBanners((b) => ({ ...b, [active]: next }));

  function openAdd() {
    setEditing(null);
    setTitle(""); setImageUrl(""); setLinkUrl("");
    setOpenInNewTab(false); setStartsAt(""); setEndsAt("");
    setFormOpen(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setTitle(b.title); setImageUrl(b.imageUrl); setLinkUrl(b.linkUrl ?? "");
    setOpenInNewTab(b.openInNewTab);
    setStartsAt(isoToLocalInput(b.startsAt)); setEndsAt(isoToLocalInput(b.endsAt));
    setFormOpen(true);
  }

  function save() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!imageUrl.trim()) { toast.error("An image is required"); return; }

    const payload = {
      placement: active,
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim() || null,
      openInNewTab,
      startsAt: localInputToIso(startsAt),
      endsAt: localInputToIso(endsAt),
    };

    startTransition(async () => {
      if (editing) {
        const res = await bannersAdminApiBrowser.update(editing.id, payload).catch(() => null);
        if (!res) { toast.error("Failed to save banner"); return; }
        patch(items.map((it) => (it.id === editing.id ? res.data : it)));
        toast.success("Banner updated");
      } else {
        const res = await bannersAdminApiBrowser.create(payload).catch(() => null);
        if (!res) { toast.error("Failed to create banner"); return; }
        patch([...items, res.data]);
        toast.success("Banner created");
      }
      setFormOpen(false);
    });
  }

  function toggle(b: Banner) {
    startTransition(async () => {
      const res = await bannersAdminApiBrowser.toggle(b.id).catch(() => null);
      if (!res) { toast.error("Failed to update banner"); return; }
      patch(items.map((it) => (it.id === b.id ? res.data : it)));
      toast.success(res.data.isActive ? "Banner shown" : "Banner hidden");
    });
  }

  function remove(b: Banner) {
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await bannersAdminApiBrowser.delete(b.id).catch(() => null);
      if (!res) { toast.error("Failed to delete banner"); return; }
      patch(items.filter((it) => it.id !== b.id));
      toast.success("Banner deleted");
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const prev = items;
    patch(next);
    startTransition(async () => {
      const res = await bannersAdminApiBrowser
        .reorder(next.map((it, i) => ({ id: it.id, order: i })))
        .catch(() => null);
      if (!res) { patch(prev); toast.error("Failed to reorder"); }
    });
  }

  return (
    <div className="p-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Banner"
        message={deleteTarget ? <>Delete banner <strong>"{deleteTarget.title}"</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && remove(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
          <ImageIcon className="h-[18px] w-[18px] text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500">Popup & top-strip promotional banners shown on the public site.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {PLACEMENTS.map((key) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive ? "border-brand-200 bg-brand-50 text-brand-700" : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {PLACEMENT_META[key].label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                isActive ? "bg-brand-200 text-brand-800" : "bg-gray-100 text-gray-500"
              }`}>
                {banners[key].length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div>
            <p className="text-sm font-semibold text-gray-900">{PLACEMENT_META[active].label}</p>
            <p className="text-xs text-gray-400">{PLACEMENT_META[active].description}</p>
          </div>
          <button
            onClick={openAdd}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Add banner
          </button>
        </div>

        <ul className="divide-y divide-gray-50">
          {items.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-gray-400">No banners yet. Click “Add banner”.</li>
          )}
          {items.map((b, i) => (
            <li key={b.id} className={`flex items-center gap-3 px-5 py-3.5 ${b.isActive ? "" : "opacity-55"}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0 || isPending} className="text-gray-300 hover:text-brand-600 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1 || isPending} className="text-gray-300 hover:text-brand-600 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt={b.title} className="h-12 w-20 shrink-0 rounded-lg border border-gray-100 object-cover" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">{b.title}</span>
                  {!b.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Hidden</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                  {b.linkUrl && <span className="flex items-center gap-1 truncate"><ExternalLink className="h-3 w-3" />{b.linkUrl}</span>}
                  {(b.startsAt || b.endsAt) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {b.startsAt ? formatDate(b.startsAt) : "always"}
                      {" – "}
                      {b.endsAt ? formatDate(b.endsAt) : "∞"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => toggle(b)} disabled={isPending} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700" title={b.isActive ? "Hide" : "Show"}>
                  {b.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(b)} disabled={isPending} className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteTarget(b)} disabled={isPending} className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">
                {editing ? "Edit banner" : "Add banner"} · {PLACEMENT_META[active].label}
              </h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Title (internal label)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eid Offer 75%" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              {/* Image */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Image</label>
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="preview" className="mb-2 max-h-40 w-full rounded-xl border border-gray-100 object-contain" />
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMediaOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <ImageIcon className="h-3.5 w-3.5" /> Media Library
                  </button>
                </div>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="…or paste an image URL" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Link URL (optional)</label>
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/courses?courseType=LIVE_COURSE or https://…" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400" />
                Open link in a new tab
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">Starts (optional)</label>
                  <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-700">Ends (optional)</label>
                  <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full rounded-xl border border-gray-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-3.5">
              <button onClick={() => setFormOpen(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={save} disabled={isPending} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                {editing ? "Save changes" : "Add banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mediaOpen && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => { setImageUrl(file.url); setMediaOpen(false); }}
          onClose={() => setMediaOpen(false)}
        />
      )}
    </div>
  );
}
