"use client";

import { useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, SpinnerGap, CheckCircle, WarningCircle, Trash,
  CaretDown, ArrowLineUp, ListChecks, Download, ArrowDown,
  FileArrowUp, SealCheck, Warning, ArrowsClockwise,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import type { BackupJob, BackupTable, BackupCategory, ImportPreview } from "./api";
import {
  triggerFullBackupAction,
  triggerCategoryBackupAction,
  triggerSelectiveBackupAction,
  deleteBackupAction,
  getBackupHistoryAction,
  dryRunImportAction,
  importBackupAction,
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

const TYPE_BADGE: Record<string, string> = {
  full: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  category: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  selective: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  import: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initialBackups: BackupJob[];
  initialTotal: number;
  initialTables: BackupTable[];
  initialCategories: BackupCategory[];
}

export function BackupClient({
  initialBackups,
  initialTotal,
  initialTables,
  initialCategories,
}: Props) {
  const [backups, setBackups] = useState(initialBackups);
  const [total, setTotal] = useState(initialTotal);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    categories: true,
    full: false,
    custom: false,
    restore: false,
    history: true,
  });

  function toggle(section: string) {
    setExpanded((p) => ({ ...p, [section]: !p[section] }));
  }

  const refreshHistory = useCallback(async () => {
    const res = await getBackupHistoryAction();
    if (res.success) {
      setBackups(res.data.data);
      setTotal(res.data.total);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Category-based backup */}
      <CategoryBackupSection
        categories={initialCategories}
        isOpen={expanded.categories ?? false}
        onToggle={() => toggle("categories")}
        onBackupStarted={refreshHistory}
      />

      {/* Full backup */}
      <CollapsibleSection
        title="Full Database Backup"
        subtitle="Complete SQL dump for disaster recovery"
        icon={<Database size={18} weight="fill" />}
        iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
        isOpen={expanded.full ?? false}
        onToggle={() => toggle("full")}
      >
        <FullBackupPanel onBackupStarted={refreshHistory} />
      </CollapsibleSection>

      {/* Custom / selective backup */}
      <CollapsibleSection
        title="Custom Backup"
        subtitle="Pick specific tables for export"
        icon={<ListChecks size={18} weight="fill" />}
        iconBg="bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300"
        isOpen={expanded.custom ?? false}
        onToggle={() => toggle("custom")}
      >
        <CustomBackupPanel tables={initialTables} onBackupStarted={refreshHistory} />
      </CollapsibleSection>

      {/* Restore */}
      <CollapsibleSection
        title="Restore from Backup"
        subtitle="Import a previous backup into the database"
        icon={<ArrowDown size={18} weight="fill" />}
        iconBg="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
        isOpen={expanded.restore ?? false}
        onToggle={() => toggle("restore")}
      >
        <RestorePanel backups={backups} onImportStarted={refreshHistory} />
      </CollapsibleSection>

      {/* History */}
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

// ─── Collapsible Section Shell ───────────────────────────────────────────────

function CollapsibleSection({
  title,
  subtitle,
  icon,
  iconBg,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
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
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
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
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Category Backup Section ─────────────────────────────────────────────────

function CategoryBackupSection({
  categories,
  isOpen,
  onToggle,
  onBackupStarted,
}: {
  categories: BackupCategory[];
  isOpen: boolean;
  onToggle: () => void;
  onBackupStarted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleBackup(categoryId: string) {
    startTransition(async () => {
      const res = await triggerCategoryBackupAction(categoryId);
      if (res.success) {
        toast.success("Category backup started — running in background");
        onBackupStarted();
      } else {
        toast.error(res.message ?? "Failed to start backup");
      }
    });
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
          <ArrowsClockwise size={18} weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Backup by Category</h3>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {categories.length} categories — pick what to back up
          </p>
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleBackup(cat.id)}
                    disabled={isPending}
                    className="group rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {cat.label}
                    </div>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        {cat.tables.length} tables
                      </span>
                      {isPending ? (
                        <SpinnerGap size={14} className="animate-spin text-blue-500" />
                      ) : (
                        <ArrowLineUp
                          size={14}
                          className="text-gray-300 transition-colors group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-400"
                          weight="bold"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Full Backup Panel ───────────────────────────────────────────────────────

function FullBackupPanel({ onBackupStarted }: { onBackupStarted: () => void }) {
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        Complete SQL dump of all tables. Best for disaster recovery. Downloads as a compressed .sql.gz file.
      </p>
      <button
        onClick={handleFullBackup}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
      >
        {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <ArrowLineUp size={15} weight="bold" />}
        {isPending ? "Starting..." : "Start Full Backup"}
      </button>
    </div>
  );
}

// ─── Custom Backup Panel ─────────────────────────────────────────────────────

function CustomBackupPanel({
  tables,
  onBackupStarted,
}: {
  tables: BackupTable[];
  onBackupStarted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [showTablePicker, setShowTablePicker] = useState(false);

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
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Choose specific tables to export as JSON. Good for partial exports and data migration.
        </p>
        <button
          onClick={() => setShowTablePicker(!showTablePicker)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus-visible:ring-offset-slate-900"
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

      <AnimatePresence>
        {showTablePicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
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
  );
}

// ─── Restore Panel ───────────────────────────────────────────────────────────

function RestorePanel({
  backups,
  onImportStarted,
}: {
  backups: BackupJob[];
  onImportStarted: () => void;
}) {
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<string>("skip");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const completedBackups = backups.filter(
    (b) => b.status === "completed" && b.format === "json" && b.type !== "import"
  );

  const selectedBackup = completedBackups.find((b) => b.id === selectedBackupId);

  function handleDryRun() {
    if (!selectedBackupId) return;
    setIsDryRunning(true);
    startTransition(async () => {
      const res = await dryRunImportAction(selectedBackupId);
      if (res.success) {
        setPreview(res.data);
        toast.success("Dry-run complete — review the preview below");
      } else {
        toast.error(res.message ?? "Dry-run failed");
      }
      setIsDryRunning(false);
    });
  }

  function handleImport() {
    if (!selectedBackupId || !preview) return;
    setIsImporting(true);
    startTransition(async () => {
      const res = await importBackupAction(selectedBackupId, strategy);
      if (res.success) {
        toast.success("Import started — running in background");
        setPreview(null);
        setSelectedBackupId(null);
        onImportStarted();
      } else {
        toast.error(res.message ?? "Import failed");
      }
      setIsImporting(false);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select a previous JSON backup to restore. Run a dry-run first to preview conflicts before importing.
      </p>

      {/* Backup selector */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-slate-400">
          Select backup to restore
        </label>
        <select
          value={selectedBackupId ?? ""}
          onChange={(e) => {
            setSelectedBackupId(e.target.value ? Number(e.target.value) : null);
            setPreview(null);
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <option value="">Choose a backup…</option>
          {completedBackups.map((b) => (
            <option key={b.id} value={b.id}>
              #{b.id} — {b.category ?? b.type} — {formatDate(b.createdAt)} — {formatBytes(b.fileSize)}
            </option>
          ))}
        </select>
      </div>

      {/* Conflict strategy selector */}
      {selectedBackupId && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-slate-400">
            Conflict resolution strategy
          </label>
          <div className="flex flex-wrap gap-3">
            {(["skip", "overwrite", "merge"] as const).map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  strategy === s
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={s}
                  checked={strategy === s}
                  onChange={() => setStrategy(s)}
                  className="sr-only"
                />
                {s === "skip" && <SealCheck size={14} weight="bold" />}
                {s === "overwrite" && <Warning size={14} weight="bold" />}
                {s === "merge" && <ArrowsClockwise size={14} weight="bold" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
            {strategy === "skip" && "Skip rows that already exist (safe, no data loss)"}
            {strategy === "overwrite" && "Replace existing rows with backup data (destructive)"}
            {strategy === "merge" && "Update non-null fields from backup, insert new rows (conservative)"}
          </p>
        </motion.div>
      )}

      {/* Dry-run & Import buttons */}
      {selectedBackupId && (
        <div className="flex gap-3">
          <button
            onClick={handleDryRun}
            disabled={isDryRunning || isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {isDryRunning ? <SpinnerGap size={15} className="animate-spin" /> : <FileArrowUp size={15} weight="bold" />}
            {isDryRunning ? "Running..." : "Dry-Run Preview"}
          </button>
          {preview && (
            <button
              onClick={handleImport}
              disabled={isImporting || isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
            >
              {isImporting ? <SpinnerGap size={15} className="animate-spin" /> : <ArrowDown size={15} weight="bold" />}
              {isImporting ? "Importing..." : `Import with ${strategy} strategy`}
            </button>
          )}
        </div>
      )}

      {/* Dry-run preview */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Dry-Run Preview</h4>
          <div className="mb-3 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/50">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{preview.totalRecords.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 dark:text-slate-500">Total Records</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/50">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{preview.conflicts.length}</div>
              <div className="text-[10px] text-gray-400 dark:text-slate-500">Tables</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/50">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {preview.conflicts.filter((c) => c.existingCount > 0).length}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-slate-500">Conflicts</div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="pb-2 font-semibold text-gray-500 dark:text-slate-400">Table</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 dark:text-slate-400">Existing</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 dark:text-slate-400">Incoming</th>
                  <th className="pb-2 text-right font-semibold text-gray-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {preview.conflicts.map((c) => (
                  <tr key={c.table}>
                    <td className="py-1.5 font-medium text-gray-700 dark:text-gray-300">{c.table}</td>
                    <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{c.existingCount.toLocaleString()}</td>
                    <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{c.incomingCount.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      {c.existingCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">conflict</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
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
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[b.type] ?? TYPE_BADGE.selective}`}>
                              {b.type === "full" && "Full"}
                              {b.type === "category" && (b.category ?? "Category")}
                              {b.type === "selective" && "Selective"}
                              {b.type === "import" && "Import"}
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
