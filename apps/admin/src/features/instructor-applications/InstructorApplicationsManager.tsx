"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Trash2, X, ExternalLink, Clock, User } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { instructorApplicationsApiBrowser } from "./api/browser";
import type { InstructorApplication, ApplicationStatus } from "./types";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { initial: InstructorApplication[] }

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30",
  approved: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
};

export function InstructorApplicationsManager({ initial }: Props) {
  const [apps, setApps] = useState<InstructorApplication[]>(initial);
  const [selected, setSelected] = useState<InstructorApplication | null>(null);
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { formatDate } = useLocalization();

  const filtered = apps.filter((a) => filter === "all" || a.status === filter);
  const pendingCount = apps.filter((a) => a.status === "pending").length;

  function openApproveModal(id: number) {
    setApproveTarget(id);
    setShowApproveModal(true);
  }

  function confirmApprove() {
    if (!approveTarget) return;
    const id = approveTarget;
    setShowApproveModal(false);
    startTransition(async () => {
      const res = await instructorApplicationsApiBrowser.approve(id).catch(() => null);
      if (!res) { toast.error("Failed to approve"); return; }
      setApps((p) => p.map((a) => a.id === id ? { ...a, status: "approved" } : a));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: "approved" } : s);
      toast.success("Application approved — instructor account created");
    });
  }

  function openRejectModal(id: number) {
    setRejectTarget(id);
    setRejectNotes("");
    setShowRejectModal(true);
  }

  function confirmReject() {
    if (!rejectTarget) return;
    const id = rejectTarget;
    setShowRejectModal(false);
    startTransition(async () => {
      const res = await instructorApplicationsApiBrowser.reject(id, rejectNotes || undefined).catch(() => null);
      if (!res) { toast.error("Failed to reject"); return; }
      setApps((p) => p.map((a) => a.id === id ? { ...a, status: "rejected", adminNotes: rejectNotes || null } : a));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: "rejected", adminNotes: rejectNotes || null } : s);
      toast.success("Application rejected");
    });
  }

  function openDeleteModal(id: number) {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setShowDeleteModal(false);
    startTransition(async () => {
      const res = await instructorApplicationsApiBrowser.delete(id).catch(() => null);
      if (!res) { toast.error("Failed to delete"); return; }
      setApps((p) => p.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Application deleted");
    });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Instructor Applications
            {pendingCount > 0 && (
              <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-[11px] font-bold text-white">{pendingCount}</span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{apps.length} total applications</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-brand-600 dark:bg-brand text-white" : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* List */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-400 dark:text-slate-500">No applications.</p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-slate-800">
              {filtered.map((app) => (
                <li
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors ${
                    selected?.id === app.id ? "bg-brand-50 dark:bg-brand/10" : "hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand/15 flex items-center justify-center">
                      <User className="h-4 w-4 text-brand-600 dark:text-brand" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{app.name}</span>
                      <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{app.email}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{app.expertise}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDeleteModal(app.id); }}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1 text-gray-300 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400 mt-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Meta */}
                <div className="space-y-2">
                  {[
                    ["Email", selected.email],
                    ["Phone", selected.phone ?? "—"],
                    ["Expertise", selected.expertise],
                    ["Portfolio", selected.portfolioUrl ?? "—"],
                    ["Applied", formatDate(selected.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="text-xs text-gray-400 dark:text-slate-500 w-20 shrink-0">{label}</span>
                      {label === "Portfolio" && selected.portfolioUrl ? (
                        <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 dark:text-brand hover:underline flex items-center gap-1">
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-700 dark:text-slate-300">{value}</span>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 dark:text-slate-500 w-20 shrink-0">Status</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[selected.status]}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-slate-800" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Experience</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.experience}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Motivation</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.motivation}</p>
                </div>
                {selected.adminNotes && (
                  <div className="rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">Admin Notes</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{selected.adminNotes}</p>
                  </div>
                )}
              </div>

              {selected.status === "pending" && (
                <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-3.5 flex gap-2">
                  <button
                    onClick={() => openApproveModal(selected.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => openRejectModal(selected.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-500/15 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-500">
              <Clock className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Select an application to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Approve modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Approve Application</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">An instructor account will be created and login credentials sent by email.</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={isPending}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                Yes, Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Application</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Reject Application</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Optionally add a note for the applicant.</p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Reason for rejection (optional)…"
              className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-4 py-3 text-sm outline-none focus:border-red-400 dark:focus:border-red-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
