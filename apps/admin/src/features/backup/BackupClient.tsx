"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, SpinnerGap, CheckCircle, WarningCircle, Trash,
  CaretDown, ArrowLineUp, ListChecks, Download,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import type { BackupJob, BackupTable } from "./api";
import {
  triggerFullBackupAction,
  triggerSelectiveBackupAction,
  deleteBackupAction,
  getBackupHistoryAction,
} from "./actions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initialBackups: BackupJob[];
  initialTotal: number;
  initialTables: BackupTable[];
}

export function BackupClient({ initialBackups, initialTotal, initialTables }: Props) {
  const [backups, setBackups] = useState(initialBackups);
  const [total, setTotal] = useState(initialTotal);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ new: true, history: true });

  function toggle(section: string) {
    setExpanded((p) => ({ ...p, [section]: !p[section] }));
  }

  async function refreshHistory() {
    const res = await getBackupHistoryAction();
    if (res.success) {
      setBackups(res.data.data);
      setTotal(res.data.total);
    }
  }

  return (
    <div className="space-y-4">
      {/* New Backup section */}
      <NewBackupSection
        tables={initialTables}
        isOpen={expanded.new ?? false}
        onToggle={() => toggle("new")}
        onBackupStarted={refreshHistory}
      />

      {/* History section */}
      <HistorySection
        backups={backups}
        total={total}
        isOpen={expanded.history ?? false}
        onToggle={() => toggle("history")}
        onRefresh={refreshHistory}
      />
    </div>
  );
}

// ─── New Backup Section ──────────────────────────────────────────────────────

function NewBackupSection({
  tables,
  isOpen,
  onToggle,
  onBackupStarted,
}: {
  tables: BackupTable[];
  isOpen: boolean;
  onToggle: () => void;
  onBackupStarted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [showTablePicker, setShowTablePicker] = useState(false);

  function handleFullBackup() {
    startTransition(async () => {
      const res = await triggerFullBackupAction();
      if (res.success) {
        toast.success("Full backup started — running in background");
        onBackupStarted();
      } else {
        toast.error(res.message ?? "Failed to start backup");
      }
    });
  }

  function handleSelectiveBackup() {
    if (selectedTables.size === 0) {
      toast.error("Select at least one table");
      return;
    }
    startTransition(async () => {
      const res = await triggerSelectiveBackupAction(Array.from(selectedTables));
      if (res.success) {
        toast.success("Selective backup started — running in background");
        setSelectedTables(new Set());
        setShowTablePicker(false);
        onBackupStarted();
      } else {
        toast.error(res.message ?? "Failed to start backup");
      }
    });
  }

  function toggleTable(name: string) {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAll() {
    setSelectedTables(new Set(tables.map((t) => t.name)));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shadow-sm ring-1 ring-black/5 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-white/10">
          <ArrowLineUp size={18} weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">New Backup</h3>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">Full SQL dump or selective JSON export</p>
        </div>
        <CaretDown
          size={16} weight="bold"
          className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-gray-100 px-5 py-5 dark:border-slate-800">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Full Backup */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-3 flex items-center gap-2">
                    <Database size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Full Database Backup</h4>
                  </div>
                  <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                    Complete SQL dump of all tables. Best for disaster recovery. Downloads as a compressed .sql.gz file.
                  </p>
                  <button
                    onClick={handleFullBackup}
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
                  >
                    {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <ArrowLineUp size={15} weight="bold" />}
                    {isPending ? "Starting..." : "Start Full Backup"}
                  </button>
                </div>

                {/* Selective Backup */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-3 flex items-center gap-2">
                    <ListChecks size={16} weight="fill" className="text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Selective Backup</h4>
                  </div>
                  <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                    Choose specific tables to export as JSON. Good for partial exports and data migration.
                  </p>
                  <button
                    onClick={() => setShowTablePicker(!showTablePicker)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus-visible:ring-offset-slate-900"
                  >
                    <ListChecks size={15} weight="bold" />
                    {showTablePicker ? "Hide Tables" : "Select Tables"}
                    {selectedTables.size > 0 && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                        {selectedTables.size}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Table Picker */}
              <AnimatePresence>
                {showTablePicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          {tables.length} tables available
                        </span>
                        <div className="flex gap-2">
                          <button onClick={selectAll} className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                            Select All
                          </button>
                          <button onClick={() => setSelectedTables(new Set())} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400">
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 space-y-1 overflow-y-auto">
                        {tables.map((t) => (
                          <label
                            key={t.name}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTables.has(t.name)}
                              onChange={() => toggleTable(t.name)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600"
                            />
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{t.name}</span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">{t.rowCount.toLocaleString()} rows</span>
                          </label>
                        ))}
                      </div>
                      {selectedTables.size > 0 && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={handleSelectiveBackup}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-purple-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
                          >
                            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <ArrowLineUp size={15} weight="bold" />}
                            {isPending ? "Starting..." : `Backup ${selectedTables.size} Tables`}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── History Section ─────────────────────────────────────────────────────────

function HistorySection({
  backups,
  total,
  isOpen,
  onToggle,
  onRefresh,
}: {
  backups: BackupJob[];
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this backup? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await deleteBackupAction(id);
    if (res.success) {
      toast.success("Backup deleted");
      onRefresh();
    } else {
      toast.error(res.message ?? "Failed to delete");
    }
    setDeletingId(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.03, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:text-gray-300 dark:ring-white/10">
          <ListChecks size={18} weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Backup History</h3>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{total} backup(s) on record</p>
        </div>
        <CaretDown
          size={16} weight="bold"
          className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-gray-100 dark:border-slate-800">
              {backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                  <Database size={28} weight="light" className="text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No backups yet. Create your first backup above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Type</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Format</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Status</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Size</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Created</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                      {backups.map((b) => (
                        <tr key={b.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              b.type === "full"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
                            }`}>
                              {b.type === "full" ? "Full" : "Selective"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">{b.format}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[b.status] ?? STATUS_BADGE.pending}`}>
                              {b.status === "running" && <SpinnerGap size={10} className="animate-spin" />}
                              {b.status === "completed" && <CheckCircle size={10} weight="fill" />}
                              {b.status === "failed" && <WarningCircle size={10} weight="fill" />}
                              {b.status}
                            </span>
                            {b.errorMessage && (
                              <p className="mt-1 max-w-[200px] truncate text-[10px] text-red-500" title={b.errorMessage}>{b.errorMessage}</p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{formatBytes(b.fileSize)}</td>
                          <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(b.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              {b.fileUrl && b.status === "completed" && (
                                <a
                                  href={b.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                                  title="Download"
                                >
                                  <Download size={14} />
                                </a>
                              )}
                              <button
                                onClick={() => handleDelete(b.id)}
                                disabled={deletingId === b.id}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === b.id ? <SpinnerGap size={14} className="animate-spin" /> : <Trash size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
