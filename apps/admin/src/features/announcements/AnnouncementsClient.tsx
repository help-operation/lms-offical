"use client";

import { useState, useTransition } from "react";
import {
  Megaphone,
  Plus,
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  SpinnerGap,
  X,
  FloppyDisk,
  CalendarBlank,
  Warning,
  CheckCircle,
  Info,
  XCircle,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  getAnnouncementsAction,
  createAnnouncementAction,
  updateAnnouncementAction,
  toggleAnnouncementAction,
  deleteAnnouncementAction,
} from "./actions";
import type { Announcement, AnnouncementsResponse, AnnouncementType } from "./types";
import { TYPE_META } from "./types";
import { useLocalization } from "@/shared/context/LocalizationContext";

const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: "info",    label: "ℹ️  Info"    },
  { value: "success", label: "✅ Success" },
  { value: "warning", label: "⚠️  Warning" },
  { value: "error",   label: "❌ Error"   },
];

const TYPE_ICONS: Record<AnnouncementType, React.ElementType> = {
  info:    Info,
  success: CheckCircle,
  warning: Warning,
  error:   XCircle,
};

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function AnnouncementModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Announcement | null;
  onClose: () => void;
  onSaved: (a: Announcement) => void;
}) {
  const [title,     setTitle]     = useState(editing?.title     ?? "");
  const [body,      setBody]      = useState(editing?.body       ?? "");
  const [type,      setType]      = useState<AnnouncementType>(editing?.type ?? "info");
  const [expiresAt, setExpiresAt] = useState(
    editing?.expiresAt ? new Date(editing.expiresAt).toISOString().slice(0, 16) : "",
  );
  const [isPending, start] = useTransition();

  function handleSave() {
    if (!title.trim() || !body.trim()) { toast.error("Title and body are required"); return; }
    start(async () => {
      const payload = {
        title:     title.trim(),
        body:      body.trim(),
        type,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      const res = editing
        ? await updateAnnouncementAction(editing.id, payload)
        : await createAnnouncementAction(payload);

      if (res.success) {
        toast.success(editing ? "Announcement updated" : "Announcement created");
        onSaved(res.data);
        onClose();
      } else {
        toast.error(res.message ?? "Failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {editing ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((o) => {
                const meta = TYPE_META[o.value];
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setType(o.value)}
                    className={`rounded-xl border-2 py-2 text-xs font-semibold transition ${
                      type === o.value
                        ? `${meta.border} ${meta.bg} ${meta.text}`
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Platform maintenance on May 30"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write your announcement message…"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition resize-none"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Expires At <span className="text-gray-400 font-normal">(optional — auto-hides after this date)</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 transition"
          >
            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
            {editing ? "Save Changes" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({
  announcement,
  onEdit,
  onToggled,
  onDeleted,
}: {
  announcement: Announcement;
  onEdit: () => void;
  onToggled: (a: Announcement) => void;
  onDeleted: () => void;
}) {
  const [isToggling, startToggle] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const meta = TYPE_META[announcement.type];
  const Icon = TYPE_ICONS[announcement.type];
  const { formatDate } = useLocalization();

  const expiredDate = announcement.expiresAt
    ? formatDate(announcement.expiresAt)
    : null;
  const isExpired = announcement.expiresAt ? new Date(announcement.expiresAt) < new Date() : false;

  function handleToggle() {
    setShowToggleConfirm(false);
    startToggle(async () => {
      const res = await toggleAnnouncementAction(announcement.id);
      if (res.success) {
        onToggled(res.data);
        toast.success(res.data.isActive ? "Announcement published" : "Announcement hidden");
      } else {
        toast.error(res.message ?? "Failed");
      }
    });
  }

  function handleDelete() {
    setShowDeleteConfirm(false);
    startDelete(async () => {
      const res = await deleteAnnouncementAction(announcement.id);
      if (res.success) { toast.success("Deleted"); onDeleted(); }
      else toast.error(res.message ?? "Failed");
    });
  }

  return (
    <>
    <ConfirmModal
      open={showToggleConfirm}
      title={announcement.isActive ? "Hide Announcement" : "Publish Announcement"}
      message={
        announcement.isActive
          ? <>Hide <strong>{announcement.title}</strong>? Students will no longer see it.</>
          : <>Publish <strong>{announcement.title}</strong>? All students will see it.</>
      }
      confirmLabel={announcement.isActive ? "Yes, Hide" : "Yes, Publish"}
      variant={announcement.isActive ? "warning" : "success"}
      isPending={isToggling}
      onConfirm={handleToggle}
      onClose={() => setShowToggleConfirm(false)}
    />
    <ConfirmModal
      open={showDeleteConfirm}
      title="Delete Announcement"
      message={<>Delete <strong>{announcement.title}</strong>? This cannot be undone.</>}
      confirmLabel="Yes, Delete"
      variant="danger"
      isPending={isDeleting}
      onConfirm={handleDelete}
      onClose={() => setShowDeleteConfirm(false)}
    />
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      !announcement.isActive || isExpired ? "opacity-60" : ""
    }`}>
      {/* Type stripe */}
      <div className={`h-1 ${
        announcement.type === "info"    ? "bg-blue-500"
        : announcement.type === "success" ? "bg-green-500"
        : announcement.type === "warning" ? "bg-amber-500"
        : "bg-red-500"
      }`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${meta.bg} border ${meta.border}`}>
              <Icon size={18} weight="fill" className={meta.text} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-sm font-bold text-gray-900">{announcement.title}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.text} border ${meta.border}`}>
                  {meta.label}
                </span>
                {isExpired && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                    Expired
                  </span>
                )}
                {!announcement.isActive && !isExpired && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                    Hidden
                  </span>
                )}
                {announcement.isActive && !isExpired && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                    Live
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{announcement.body}</p>
              {expiredDate && (
                <div className="flex items-center gap-1.5 mt-2">
                  <CalendarBlank size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-400">
                    {isExpired ? "Expired" : "Expires"} {expiredDate}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle */}
            <button
              onClick={() => setShowToggleConfirm(true)}
              disabled={isToggling || isDeleting}
              title={announcement.isActive ? "Hide" : "Publish"}
              className="flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-50 transition"
            >
              {isToggling ? (
                <SpinnerGap size={22} className="animate-spin" />
              ) : announcement.isActive ? (
                <ToggleRight size={28} weight="fill" className="text-green-500" />
              ) : (
                <ToggleLeft size={28} className="text-gray-300" />
              )}
            </button>
            {/* Edit */}
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition"
            >
              <PencilSimple size={14} weight="bold" />
            </button>
            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-500 disabled:opacity-50 transition"
            >
              {isDeleting ? <SpinnerGap size={14} className="animate-spin" /> : <Trash size={14} weight="bold" />}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function AnnouncementsClient({ initial }: { initial: AnnouncementsResponse }) {
  const [data,    setData]    = useState(initial);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [page,    setPage]    = useState(1);
  const [isPending, startTransition] = useTransition();

  async function reload(p: number) {
    startTransition(async () => {
      const res = await getAnnouncementsAction({ page: p });
      if (res.success) { setData(res.data); setPage(p); }
    });
  }

  function handleSaved(a: Announcement) {
    // Either replace existing or prepend new
    setData((prev) => {
      const exists = prev.data.find((x) => x.id === a.id);
      if (exists) return { ...prev, data: prev.data.map((x) => x.id === a.id ? a : x) };
      return { ...prev, data: [a, ...prev.data], stats: { ...prev.stats, total: prev.stats.total + 1 } };
    });
  }

  function handleToggled(a: Announcement) {
    setData((prev) => ({ ...prev, data: prev.data.map((x) => x.id === a.id ? a : x) }));
  }

  function handleDeleted(id: number) {
    setData((prev) => ({
      ...prev,
      data:  prev.data.filter((x) => x.id !== id),
      stats: { ...prev.stats, total: Math.max(0, prev.stats.total - 1) },
    }));
  }

  const { data: items, pagination, stats } = data;
  const liveCount = items.filter((a) => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > new Date())).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Broadcast messages to all students</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 transition"
        >
          <Plus size={15} weight="bold" />
          New Announcement
        </button>
      </div>

      {/* Summary banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4">
        <Megaphone size={20} weight="fill" className="text-brand-600 shrink-0" />
        <p className="text-sm text-brand-700">
          <span className="font-bold">{liveCount}</span> announcement{liveCount !== 1 ? "s" : ""} currently live.{" "}
          <span className="font-bold">{stats.total}</span> total created.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <Megaphone size={40} weight="thin" className="text-gray-300" />
            <p className="text-sm text-gray-400">No announcements yet. Create one to reach your students.</p>
          </div>
        ) : (
          items.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onEdit={() => setEditing(a)}
              onToggled={handleToggled}
              onDeleted={() => handleDeleted(a.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {pagination.current_page} of {pagination.last_page}</p>
          <div className="flex gap-2">
            <button
              onClick={() => reload(page - 1)}
              disabled={page <= 1 || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <CaretLeft size={13} weight="bold" />
            </button>
            <button
              onClick={() => reload(page + 1)}
              disabled={page >= pagination.last_page || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <CaretRight size={13} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <AnnouncementModal
          editing={null}
          onClose={() => setShowNew(false)}
          onSaved={(a) => { handleSaved(a); setShowNew(false); }}
        />
      )}
      {editing && (
        <AnnouncementModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={(a) => { handleSaved(a); setEditing(null); }}
        />
      )}
    </div>
  );
}
