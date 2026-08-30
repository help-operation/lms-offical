"use client";

import { useEffect, useState } from "react";
import { listBatchesAction, type LiveCourseBatch } from "./live-course-batches.api";
import { DatePicker } from "@repo/ui/date-picker";
import { toast } from "@repo/ui/sonner";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import { useLocalization } from "@/shared/context/LocalizationContext";
import {
  listSessionsAction,
  createSessionAction,
  updateSessionAction,
  deleteSessionAction,
  listResourcesAction,
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
  listAssignmentsAction,
  createAssignmentAction,
  updateAssignmentAction,
  deleteAssignmentAction,
  listSubmissionsAction,
  gradeSubmissionAction,
  type AdminSession,
  type AdminResource,
  type AdminAssignment,
  type AdminSubmission,
} from "./live-batch.api";

const input = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400";
const btn = "rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60";
const btnGhost = "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50";

export function LiveBatchManagerPanel({ courseId }: { courseId: number }) {
  const [batches, setBatches] = useState<LiveCourseBatch[]>([]);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await listBatchesAction(courseId);
      setBatches(res.data);
      if (res.data[0]) setBatchId(res.data[0].id);
      setLoading(false);
    })();
  }, [courseId]);

  if (loading) return <p className="py-8 text-center text-sm text-gray-400">Loading…</p>;

  if (batches.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
        Create a batch first (Batches tab) to manage its classes & assignments.
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Batch selector */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-500">Managing batch</label>
        <select
          value={batchId ?? ""}
          onChange={(e) => setBatchId(Number(e.target.value))}
          className={input}
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.batchName} ({b.status})
            </option>
          ))}
        </select>
      </div>

      {batchId && <SessionsManager batchId={batchId} />}
      {batchId && <AssignmentsManager batchId={batchId} />}
      <ResourcesManager courseId={courseId} />
    </div>
  );
}

// ─── Sessions ───────────────────────────────────────────────────────────────

function SessionsManager({ batchId }: { batchId: number }) {
  const [items, setItems] = useState<AdminSession[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; scheduledAt?: string }>({});
  const { formatDateTime } = useLocalization();

  const load = async () => setItems((await listSessionsAction(batchId)).data ?? []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [batchId]);

  async function save() {
    const next: { title?: string; scheduledAt?: string } = {};
    if (!form?.title?.trim()) next.title = "Title is required";
    if (!form?.scheduledAt) next.scheduledAt = "Date & time is required";
    setErrors(next);
    if (next.title || next.scheduledAt) return;

    setBusy(true);
    const res = form.id
      ? await updateSessionAction(form.id, form)
      : await createSessionAction(batchId, form);
    setBusy(false);
    if (!res.success) { toast.error(res.message ?? "Failed to save live class"); return; }
    toast.success(form.id ? "Live class updated" : "Live class added");
    setForm(null);
    setErrors({});
    load();
  }

  return (
    <Card title="Live Classes" onAdd={() => { setForm({ title: "", scheduledAt: "", durationMinutes: 60, status: "scheduled" }); setErrors({}); }}>
      {items.map((s) => (
        <Row key={s.id} title={s.title} subtitle={`${formatDateTime(s.scheduledAt)} · ${s.status}`}
          onEdit={() => setForm({ ...s, scheduledAt: toLocal(s.scheduledAt) })}
          onDelete={async () => { await deleteSessionAction(s.id); load(); }} />
      ))}
      {items.length === 0 && <Empty />}

      {form && (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <div>
            <input className={input} placeholder="Session title" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }} />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>
          <div>
            <DatePicker
              value={form.scheduledAt}
              onChange={(v) => { setForm({ ...form, scheduledAt: v }); if (errors.scheduledAt) setErrors((p) => ({ ...p, scheduledAt: undefined })); }}
              placeholder="Pick date & time"
              showTime
              disablePast
            />
            {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
          </div>
          <div className="flex gap-2">
            <input className={input} type="number" placeholder="Duration (min)" value={form.durationMinutes ?? 60} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <input className={input} placeholder="Meeting URL (Zoom/Meet)" value={form.meetingUrl ?? ""} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} />
          <input className={input} placeholder="Recording URL (after class)" value={form.recordingUrl ?? ""} onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })} />
          <div className="flex gap-2">
            <button className={btn} disabled={busy} onClick={save}>Save</button>
            <button className={btnGhost} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Assignments ────────────────────────────────────────────────────────────

function AssignmentsManager({ batchId }: { batchId: number }) {
  const [items, setItems] = useState<AdminAssignment[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [openSubs, setOpenSubs] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const { formatDateTime } = useLocalization();

  const load = async () => setItems((await listAssignmentsAction(batchId)).data ?? []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [batchId]);

  async function save() {
    if (!form?.title?.trim()) { setErrors({ title: "Title is required" }); return; }
    setErrors({});
    setBusy(true);
    // form carries an `id` only when editing an existing assignment.
    const res = form.id
      ? await updateAssignmentAction(form.id, form)
      : await createAssignmentAction(batchId, form);
    setBusy(false);
    if (!res.success) { toast.error(res.message ?? "Failed to save assignment"); return; }
    toast.success(form.id ? "Assignment updated" : "Assignment added");
    setForm(null);
    load();
  }

  return (
    <Card title="Assignments" onAdd={() => { setForm({ title: "", maxScore: 100 }); setErrors({}); }}>
      {items.map((a) => (
        <div key={a.id}>
          <Row title={a.title} subtitle={a.dueDate ? `Due ${formatDateTime(a.dueDate)}` : `Max ${a.maxScore}`}
            onView={() => setOpenSubs(openSubs === a.id ? null : a.id)}
            onEdit={() => setForm({ ...a, dueDate: a.dueDate ? toLocal(a.dueDate) : "" })}
            onDelete={async () => { await deleteAssignmentAction(a.id); load(); }} />
          {openSubs === a.id && <SubmissionsList assignmentId={a.id} maxScore={a.maxScore} />}
        </div>
      ))}
      {items.length === 0 && <Empty />}

      {form && (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <div>
            <input className={input} placeholder="Assignment title" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (errors.title) setErrors({}); }} />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>
          <textarea className={input} rows={2} placeholder="Description / instructions" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className={input} placeholder="Instructions URL (optional)" value={form.instructionsUrl ?? ""} onChange={(e) => setForm({ ...form, instructionsUrl: e.target.value })} />
          <div className="flex gap-2">
            <div className="flex-1">
              <DatePicker
                value={form.dueDate ?? ""}
                onChange={(v) => setForm({ ...form, dueDate: v })}
                placeholder="Due date & time"
                showTime
                disablePast
              />
            </div>
            <input className={input} type="number" placeholder="Max score" value={form.maxScore ?? 100} onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2">
            <button className={btn} disabled={busy} onClick={save}>Save</button>
            <button className={btnGhost} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SubmissionsList({ assignmentId, maxScore }: { assignmentId: number; maxScore: number }) {
  const [subs, setSubs] = useState<AdminSubmission[]>([]);
  const load = async () => setSubs((await listSubmissionsAction(assignmentId)).data ?? []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [assignmentId]);

  return (
    <div className="ml-3 mt-2 space-y-2 border-l-2 border-brand-100 pl-3">
      {subs.length === 0 && <p className="text-xs text-gray-400">No submissions yet.</p>}
      {subs.map((s) => (
        <GradeRow key={s.id} sub={s} maxScore={maxScore} onGraded={load} />
      ))}
    </div>
  );
}

function GradeRow({ sub, maxScore, onGraded }: { sub: AdminSubmission; maxScore: number; onGraded: () => void }) {
  const [score, setScore] = useState(sub.score ?? 0);
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2 text-xs">
      <p className="font-semibold text-gray-800">{sub.studentFirstName} {sub.studentLastName}</p>
      {sub.submissionUrl && <a href={sub.submissionUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">View link</a>}
      {sub.submissionText && <p className="mt-1 whitespace-pre-wrap text-gray-500">{sub.submissionText}</p>}
      <div className="mt-2 flex items-center gap-2">
        <input type="number" className="w-16 rounded border border-gray-200 px-2 py-1" value={score} max={maxScore} onChange={(e) => setScore(Number(e.target.value))} />
        <span className="text-gray-400">/ {maxScore}</span>
        <input className="flex-1 rounded border border-gray-200 px-2 py-1" placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <button className={btn} disabled={busy} onClick={async () => { setBusy(true); await gradeSubmissionAction(sub.id, { score, feedback }); setBusy(false); onGraded(); }}>
          {sub.status === "graded" ? "Update" : "Grade"}
        </button>
      </div>
    </div>
  );
}

// ─── Resources ──────────────────────────────────────────────────────────────

function ResourcesManager({ courseId }: { courseId: number }) {
  const [items, setItems] = useState<AdminResource[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; fileUrl?: string }>({});

  const load = async () => setItems((await listResourcesAction(courseId)).data ?? []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [courseId]);

  async function save() {
    const next: { title?: string; fileUrl?: string } = {};
    if (!form?.title?.trim()) next.title = "Title is required";
    if (!form?.fileUrl?.trim()) next.fileUrl = "File URL is required — type one or pick from the Library";
    setErrors(next);
    if (next.title || next.fileUrl) return;

    setBusy(true);
    // updateResource spreads the whole dto into the UPDATE, so send only the
    // editable columns (never id/createdAt). form carries an `id` when editing.
    const payload = {
      title: form.title.trim(),
      fileUrl: form.fileUrl.trim(),
      fileType: form.fileType?.trim() || undefined,
    };
    const res = form.id
      ? await updateResourceAction(form.id, payload)
      : await createResourceAction(courseId, payload);
    setBusy(false);
    if (!res.success) { toast.error(res.message ?? "Failed to save resource"); return; }
    toast.success(form.id ? "Resource updated" : "Resource added");
    setForm(null);
    setErrors({});
    load();
  }

  return (
    <Card title="Resources (downloadable)" onAdd={() => { setForm({ title: "", fileUrl: "" }); setErrors({}); }}>
      {items.map((r) => (
        <Row key={r.id} title={r.title} subtitle={r.fileType ?? r.fileUrl}
          onEdit={() => { setForm({ ...r, fileType: r.fileType ?? "" }); setErrors({}); }}
          onDelete={async () => { await deleteResourceAction(r.id); load(); }} />
      ))}
      {items.length === 0 && <Empty />}

      {form && (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <div>
            <input className={input} placeholder="Title" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }} />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>
          <div>
            <div className="flex gap-2">
              <input className={input} placeholder="File URL" value={form.fileUrl} onChange={(e) => { setForm({ ...form, fileUrl: e.target.value }); if (errors.fileUrl) setErrors((p) => ({ ...p, fileUrl: undefined })); }} />
              <button type="button" className={btnGhost} onClick={() => setPickerOpen(true)}>Library</button>
            </div>
            {errors.fileUrl && <p className="mt-1 text-xs text-red-500">{errors.fileUrl}</p>}
          </div>
          <input className={input} placeholder="Type (PDF, ZIP…)" value={form.fileType ?? ""} onChange={(e) => setForm({ ...form, fileType: e.target.value })} />
          <div className="flex gap-2">
            <button className={btn} disabled={busy} onClick={save}>Save</button>
            <button className={btnGhost} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <MediaLibraryModal
          onSelect={(file) => {
            // Derive the Type from the file extension (e.g. "notes.pdf" → "PDF").
            const ext = file.filename.includes(".") ? file.filename.split(".").pop()!.toUpperCase() : "";
            setForm((f: any) => ({ ...f, fileUrl: file.url, fileType: ext || f?.fileType || "" }));
            if (errors.fileUrl) setErrors((p) => ({ ...p, fileUrl: undefined }));
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Card>
  );
}

// ─── Shared UI ──────────────────────────────────────────────────────────────

function Card({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <button className={btn} onClick={onAdd}>+ Add</button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ title, subtitle, onEdit, onView, onDelete }: { title: string; subtitle?: string; onEdit?: () => void; onView?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{title}</p>
        {subtitle && <p className="truncate text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 gap-1.5">
        {onView && <button className={btnGhost} onClick={onView}>Submissions</button>}
        {onEdit && <button className={btnGhost} onClick={onEdit}>Edit</button>}
        {onDelete && <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-gray-400">Nothing here yet.</p>;
}

function toLocal(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // Format to yyyy-MM-ddTHH:mm for datetime-local
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
