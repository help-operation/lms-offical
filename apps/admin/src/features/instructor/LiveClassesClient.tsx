"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";
import { createLiveClassAction, updateLiveClassAction } from "@/features/instructor/actions/live-classes.actions";
import type { LiveClass } from "@/features/instructor/api";
import { toast } from "@repo/ui/sonner";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initialClasses: LiveClass[] }

const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  live: "bg-red-100 text-red-600",
  ended: "bg-gray-100 text-gray-500",
  cancelled: "bg-yellow-100 text-yellow-700",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  scheduledAt: "",
  meetingUrl: "",
};

export function LiveClassesClient({ initialClasses }: Props) {
  const { formatDateTime } = useLocalization();
  const [classes, setClasses] = useState(initialClasses);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setCreating(true);
  }

  function openEdit(cls: LiveClass) {
    setCreating(false);
    setEditId(cls.id);
    setForm({
      title: cls.title,
      description: cls.description ?? "",
      scheduledAt: cls.scheduledAt ? new Date(cls.scheduledAt).toISOString().slice(0, 16) : "",
      meetingUrl: cls.meetingUrl ?? "",
    });
    setError(null);
  }

  function handleCreate() {
    if (!form.title.trim() || !form.scheduledAt) return;
    setError(null);
    startTransition(async () => {
      const res = await createLiveClassAction({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        meetingUrl: form.meetingUrl.trim() || undefined,
      });
      if (res.success) {
        setClasses((prev) => [res.data, ...prev]);
        setCreating(false);
        setForm(EMPTY_FORM);
        toast.success("Live class scheduled");
      } else {
        setError(res.message ?? "Failed to create live class");
      }
    });
  }

  function handleUpdate(id: number) {
    if (!form.title.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await updateLiveClassAction(id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        meetingUrl: form.meetingUrl.trim() || undefined,
      });
      if (res.success) {
        setClasses((prev) => prev.map((c) => c.id === id ? res.data : c));
        setEditId(null);
        toast.success("Live class updated");
      } else {
        setError(res.message ?? "Failed to update live class");
      }
    });
  }

  function handleStatusChange(id: number, status: "scheduled" | "live" | "ended" | "cancelled") {
    startTransition(async () => {
      const res = await updateLiveClassAction(id, { status });
      if (res.success) {
        setClasses((prev) => prev.map((c) => c.id === id ? res.data : c));
        toast.success(`Status changed to ${status}`);
      } else {
        toast.error(res.message ?? "Failed to update status");
      }
    });
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <ClassForm
          form={form}
          setForm={setForm}
          error={error}
          isPending={isPending}
          onSubmit={handleCreate}
          onCancel={() => { setCreating(false); setError(null); }}
          title="New Live Class"
        />
      ) : (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4" /> Schedule Live Class
        </button>
      )}

      <div className="space-y-3">
        {classes.length === 0 && (
          <p className="text-center py-12 text-sm text-gray-400">No live classes yet</p>
        )}
        {classes.map((cls) =>
          editId === cls.id ? (
            <ClassForm
              key={cls.id}
              form={form}
              setForm={setForm}
              error={error}
              isPending={isPending}
              onSubmit={() => handleUpdate(cls.id)}
              onCancel={() => { setEditId(null); setError(null); }}
              title="Edit Live Class"
            />
          ) : (
            <div key={cls.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{cls.title}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[cls.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {cls.status}
                    </span>
                  </div>
                  {cls.description && (
                    <p className="text-sm text-gray-500">{cls.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {formatDateTime(cls.scheduledAt)}
                    {cls.meetingUrl && (
                      <> · <a href={cls.meetingUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Join link</a></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={cls.status}
                    onChange={(e) => handleStatusChange(cls.id, e.target.value as "scheduled" | "live" | "ended" | "cancelled")}
                    disabled={isPending}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => openEdit(cls)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ClassForm({
  form,
  setForm,
  error,
  isPending,
  onSubmit,
  onCancel,
  title,
}: {
  form: { title: string; description: string; scheduledAt: string; meetingUrl: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  error: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        autoFocus
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Title *"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Scheduled Date & Time *</label>
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Meeting URL (Zoom / Meet)</label>
          <input
            value={form.meetingUrl}
            onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
            placeholder="https://…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={isPending || !form.title.trim() || !form.scheduledAt}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          Save
        </button>
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );
}
