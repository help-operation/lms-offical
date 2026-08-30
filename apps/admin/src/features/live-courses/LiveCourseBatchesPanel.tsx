"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Loader2, X } from "lucide-react";
import { DataTable, type Column } from "@repo/ui/data-table";
import { ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";
import { useLocalization } from "@/shared/context/LocalizationContext";
import {
  listBatchesAction,
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
  type LiveCourseBatch,
  type BatchFormData,
} from "./live-course-batches.api";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { DatePicker } from "@repo/ui/date-picker";
import { ScheduleBuilder } from "@repo/ui/schedule-builder";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<LiveCourseBatch["status"], string> = {
  upcoming: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  active:   "bg-green-100  text-green-800 dark:bg-green-500/15 dark:text-green-400",
  ended:    "bg-gray-100   text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
};

function StatusBadge({ status }: { status: LiveCourseBatch["status"] }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

/** Render an ISO (YYYY-MM-DD) batch date readably; pass through any legacy free-text. */
function fmtBatchDate(v: string | null | undefined, formatDateLocalized: (d: Date) => string): string | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return isNaN(d.getTime())
    ? v
    : formatDateLocalized(d);
}

// ─── Batch Form Modal ─────────────────────────────────────────────────────────

const EMPTY: BatchFormData = {
  batchName: "",
  status: "upcoming",
  startDate: "",
  endDate: "",
  schedule: "",
  supportSchedule: "",
  maxSeats: undefined,
  countdownEnd: "",
  notes: "",
};

function BatchModal({
  courseId,
  initial,
  nextBatchNumber,
  onClose,
  onSaved,
}: {
  courseId: number;
  initial?: LiveCourseBatch;
  nextBatchNumber: number;
  onClose: () => void;
  onSaved: (b: LiveCourseBatch) => void;
}) {
  const [form, setForm] = useState<BatchFormData>(
    initial
      ? {
          batchName:       initial.batchName,
          status:          initial.status,
          startDate:       initial.startDate       ?? "",
          endDate:         initial.endDate         ?? "",
          schedule:        initial.schedule        ?? "",
          supportSchedule: initial.supportSchedule ?? "",
          maxSeats:        initial.maxSeats ?? undefined,
          countdownEnd:    initial.countdownEnd    ?? "",
          notes:           initial.notes           ?? "",
        }
      : { ...EMPTY, batchName: `Batch ${nextBatchNumber}` },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = <K extends keyof BatchFormData>(k: K, v: BatchFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!form.batchName.trim()) { setError("Batch name is required"); return; }

    // Date/time guards — only validate values that come from the pickers
    // (ISO shaped), so any legacy free-text is left for the admin to re-pick.
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const isoDay = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);

    const start = isoDay(form.startDate);
    const end = isoDay(form.endDate);

    if (start && start < todayStr) { setError("Start date can't be in the past."); return; }
    if (end) {
      if (end < todayStr) { setError("End date can't be in the past."); return; }
      if (start && end < start) { setError("End date must be on or after the start date."); return; }
    }
    if (form.countdownEnd && /^\d{4}-\d{2}-\d{2}T/.test(form.countdownEnd)) {
      const cd = new Date(form.countdownEnd);
      if (!isNaN(cd.getTime())) {
        if (cd.getTime() < Date.now()) { setError("Countdown end can't be in the past."); return; }
        if (start && form.countdownEnd.slice(0, 10) < start) {
          setError("Countdown end must be on or after the start date.");
          return;
        }
      }
    }

    setSaving(true);
    setError("");

    const cleanForm: BatchFormData = {
      ...form,
      batchName:       form.batchName.trim(),
      startDate:       form.startDate || undefined,
      endDate:         form.endDate   || undefined,
      schedule:        form.schedule  || undefined,
      supportSchedule: form.supportSchedule || undefined,
      maxSeats:        form.maxSeats ?? undefined,
      countdownEnd:    form.countdownEnd || undefined,
      notes:           form.notes || undefined,
    };

    const res = initial
      ? await updateBatchAction(courseId, initial.id, cleanForm)
      : await createBatchAction(courseId, cleanForm);

    setSaving(false);
    if (!res.success) { setError(res.message ?? "Failed to save"); return; }
    toast.success(initial ? "Batch updated" : "Batch created");
    onSaved(res.data!);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-6 py-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {initial ? "Edit Batch" : "New Batch"}
          </h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/15 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Batch Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.batchName}
              onChange={(e) => set("batchName", e.target.value)}
              placeholder="e.g. Batch 3"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as BatchFormData["status"])}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          {/* Start / End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Start Date</label>
              <DatePicker
                value={form.startDate ?? ""}
                onChange={(v) => set("startDate", v)}
                placeholder="Pick start date"
                disablePast
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">End Date</label>
              <DatePicker
                value={form.endDate ?? ""}
                onChange={(v) => set("endDate", v)}
                placeholder="Pick end date"
                disablePast
                minDate={form.startDate || null}
              />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Class Schedule</label>
            <ScheduleBuilder
              value={form.schedule ?? ""}
              onChange={(v) => set("schedule", v)}
            />
          </div>

          {/* Support Schedule */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Support Schedule</label>
            <ScheduleBuilder
              value={form.supportSchedule ?? ""}
              onChange={(v) => set("supportSchedule", v)}
            />
          </div>

          {/* Max Seats */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Max Seats</label>
            <input
              type="number"
              min={1}
              value={form.maxSeats ?? ""}
              onChange={(e) => set("maxSeats", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Leave blank for unlimited"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {/* Countdown End */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
              Countdown End
            </label>
            <DatePicker
              value={form.countdownEnd ?? ""}
              onChange={(v) => set("countdownEnd", v)}
              placeholder="Pick date & time"
              showTime
              disablePast
              minDate={form.startDate || null}
            />
            <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">
              Used for the countdown timer on the course landing page.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Internal Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional admin notes about this batch"
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-600 dark:bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 dark:hover:bg-brand/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? "Save Changes" : "Create Batch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const BATCH_COLS: ColDef<LiveCourseBatch>[] = [
  {
    key: "batch", header: "Batch", defaultVisible: true,
    exportFields: [
      { header: "Batch Name", getValue: (b) => b.batchName },
      { header: "Notes",      getValue: (b) => b.notes ?? "" },
    ],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (b) => b.status }],
  },
  {
    key: "startDate", header: "Start Date", defaultVisible: true,
    exportFields: [{ header: "Start Date", getValue: (b) => fmtBatchDate(b.startDate, (d) => formatDate(d.toISOString())) ?? "" }],
  },
  {
    key: "schedule", header: "Schedule", defaultVisible: true,
    exportFields: [{ header: "Schedule", getValue: (b) => b.schedule ?? "" }],
  },
  {
    key: "seats", header: "Seats", defaultVisible: true,
    exportFields: [
      { header: "Seats Filled", getValue: (b) => String(b.seatsFilled) },
      { header: "Max Seats",    getValue: (b) => b.maxSeats ? String(b.maxSeats) : "Unlimited" },
    ],
  },
];

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function LiveCourseBatchesPanel({ courseId }: { courseId: number }) {
  const { formatDate: formatDateLocalized } = useLocalization();
  const [batches, setBatches]       = useState<LiveCourseBatch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<LiveCourseBatch | undefined>();
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LiveCourseBatch | null>(null);

  async function load() {
    setLoading(true);
    const res = await listBatchesAction(courseId);
    setBatches(res.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [courseId]);

  function handleSaved(batch: LiveCourseBatch) {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === batch.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = batch;
        return next;
      }
      return [...prev, batch];
    });
    setShowModal(false);
    setEditing(undefined);
  }

  async function handleDelete(batch: LiveCourseBatch) {
    setDeleteTarget(null);
    setDeleting(batch.id);
    try {
      const res = await deleteBatchAction(courseId, batch.id);
      if (!res.success) {
        toast.error(res.message ?? "Failed to delete batch");
        return;
      }
      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      toast.success("Batch deleted");
    } catch {
      toast.error("Failed to delete batch");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Batch"
        message={deleteTarget ? <>Delete <strong>{deleteTarget.batchName}</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={!!deleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Batches</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Each batch is a scheduled run of this course. The active/upcoming batch is shown on the live page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            pageData={batches}
            fields={BATCH_COLS.flatMap((c) => c.exportFields ?? [])}
            filename={`batches-course-${courseId}-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Course Batches Export"
          />
          <button
            onClick={() => { setEditing(undefined); setShowModal(true); }}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-600 dark:bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 dark:hover:bg-brand/90"
            title={`Will be pre-filled as Batch ${batches.length + 1}`}
          >
            <Plus className="h-4 w-4" /> New Batch
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-slate-500" />
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-slate-600" />
          <p className="font-semibold text-gray-500 dark:text-slate-400">No batches yet</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
            Click &ldquo;New Batch&rdquo; to create the first batch for this course.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Batches</h2>
          </div>
          <div className="px-6 pt-5 pb-6">
        <DataTable
          data={batches}
          searchKeys={["batchName"]}
          columns={[
            {
              key: "batch",
              header: "Batch",
              render: (batch: LiveCourseBatch) => (
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{batch.batchName}</p>
                  {batch.notes && <p className="text-xs text-gray-400 dark:text-slate-500 font-normal mt-0.5 line-clamp-1">{batch.notes}</p>}
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (batch: LiveCourseBatch) => <StatusBadge status={batch.status} />,
            },
            {
              key: "startDate",
              header: "Start Date",
              render: (batch: LiveCourseBatch) => (
                <span className="text-gray-600 dark:text-slate-300">{fmtBatchDate(batch.startDate, formatDateLocalized) ?? "—"}</span>
              ),
            },
            {
              key: "schedule",
              header: "Schedule",
              className: "max-w-[160px]",
              render: (batch: LiveCourseBatch) => (
                <span className="text-gray-600 dark:text-slate-300 truncate block">{batch.schedule ?? "—"}</span>
              ),
            },
            {
              key: "seats",
              header: "Seats",
              render: (batch: LiveCourseBatch) => (
                <span className="text-gray-600 dark:text-slate-300">
                  {batch.maxSeats
                    ? `${batch.seatsFilled} / ${batch.maxSeats}`
                    : batch.seatsFilled > 0
                      ? `${batch.seatsFilled} enrolled`
                      : "—"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (batch: LiveCourseBatch) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => { setEditing(batch); setShowModal(true); }}
                    className="rounded-md p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(batch)}
                    disabled={deleting === batch.id || (batch.enrolledCount ?? 0) > 0}
                    title={(batch.enrolledCount ?? 0) > 0 ? "Has enrolled students — can't delete" : "Delete batch"}
                    className="rounded-md p-1.5 text-gray-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:disabled:hover:text-slate-500"
                  >
                    {deleting === batch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ),
            },
          ] as Column<LiveCourseBatch>[]}
          emptyMessage="No batches yet"
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSizeSelector={false}
        />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <BatchModal
          courseId={courseId}
          initial={editing}
          nextBatchNumber={batches.length + 1}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
