"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import {
  X, Upload, Download, Users, WarningCircle, FileCsv, CaretDown, MagnifyingGlass,
} from "@phosphor-icons/react";
import { parseCsv, csvTemplate, type CsvRecipient } from "./csv-parser";
import type { EnrichedStudent } from "./types";

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 " +
  "dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

type SourceType = "all" | "batch" | "course" | "csv";

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "all", label: "All Students" },
  { value: "batch", label: "Batch Wise" },
  { value: "course", label: "Course / System" },
  { value: "csv", label: "CSV Upload" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  due: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
};

export function RecipientsPanel({
  allStudents,
  selectedStudentIds,
  csvRecipients,
  onToggleStudent,
  onSelectAll,
  onDeselectAll,
  onAddCsvRecipients,
  onRemoveCsvRecipient,
  onClearCsv,
  onRemoveCsvStudents,
}: {
  allStudents: EnrichedStudent[];
  selectedStudentIds: Set<number>;
  csvRecipients: CsvRecipient[];
  onToggleStudent: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onDeselectAll: () => void;
  onAddCsvRecipients: (recipients: CsvRecipient[]) => void;
  onRemoveCsvRecipient: (index: number) => void;
  onClearCsv: () => void;
  onRemoveCsvStudents: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<SourceType>("all");
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // Derived lists
  const allBatchNames = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.batchName).filter((b): b is string => !!b))),
    [allStudents],
  );
  const allCourseNames = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.courseName).filter((c) => c !== "No enrollment"))),
    [allStudents],
  );

  // Filtered students based on source
  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (source === "batch" && batchFilter) {
      list = list.filter((s) => s.batchName === batchFilter);
    }
    if (source === "course" && courseFilter) {
      list = list.filter((s) => s.courseName === courseFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.phone ?? ""} ${s.email ?? ""}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allStudents, source, batchFilter, courseFilter, search]);

  const visibleIds = useMemo(() => filteredStudents.map((s) => s.id), [filteredStudents]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.has(id));

  const totalRecipients = selectedStudentIds.size + csvRecipients.length;

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { recipients, errors } = parseCsv(text);
        setParseErrors(errors);
        if (recipients.length > 0) onAddCsvRecipients(recipients);
      };
      reader.readAsText(file);
    },
    [onAddCsvRecipients],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sms-recipients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users size={16} weight="fill" className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recipients</h3>
        </div>
        {totalRecipients > 0 && (
          <span className="rounded-lg bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            {totalRecipients} selected
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Source selector */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
            Student Source
          </label>
          <div className="relative">
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value as SourceType);
                setSearch("");
                setBatchFilter("");
                setCourseFilter("");
              }}
              className={`w-full appearance-none pr-8 ${inputCls}`}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Sub-filters for batch/course */}
        {source === "batch" && (
          <div className="mb-3">
            <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-slate-400">Select Batch</label>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className={`w-full ${inputCls}`}
            >
              <option value="">All batches ({allStudents.length})</option>
              {allBatchNames.map((b) => {
                const count = allStudents.filter((s) => s.batchName === b).length;
                return <option key={b} value={b}>{b} ({count})</option>;
              })}
            </select>
          </div>
        )}
        {source === "course" && (
          <div className="mb-3">
            <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-slate-400">Select Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={`w-full ${inputCls}`}
            >
              <option value="">All courses ({allStudents.length})</option>
              {allCourseNames.map((c) => {
                const count = allStudents.filter((s) => s.courseName === c).length;
                return <option key={c} value={c}>{c} ({count})</option>;
              })}
            </select>
          </div>
        )}

        {/* CSV Upload (when csv selected) */}
        {source === "csv" && (
          <div className="mb-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-brand-500"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={20} className="mx-auto mb-1.5 text-gray-400 dark:text-slate-500" />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Drop CSV or <span className="font-medium text-brand-600 dark:text-brand-400">browse</span>
              </p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">phone, email, name</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={handleDownloadTemplate}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400"
            >
              <Download size={11} /> Download template
            </button>
          </div>
        )}

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-500/10">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <WarningCircle size={13} weight="fill" /> {parseErrors.length} warnings
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
              {parseErrors.slice(0, 3).join("; ")}{parseErrors.length > 3 ? "…" : ""}
            </p>
          </div>
        )}

        {/* Search */}
        {source !== "csv" && (
          <div className="mb-3">
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className={`w-full pl-9 ${inputCls}`}
              />
            </div>
          </div>
        )}

        {/* Select all bar */}
        {source !== "csv" && filteredStudents.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="cursor-pointer rounded border-gray-300 accent-brand-600 dark:border-slate-600"
                checked={allVisibleSelected}
                onChange={() => {
                  if (allVisibleSelected) {
                    visibleIds.forEach((id) => {
                      if (selectedStudentIds.has(id)) onToggleStudent(id);
                    });
                  } else {
                    onSelectAll(visibleIds);
                  }
                }}
              />
              Select all ({filteredStudents.length})
            </label>
            {selectedStudentIds.size > 0 && (
              <button
                onClick={onDeselectAll}
                className="text-[11px] text-gray-400 hover:text-red-500 dark:text-slate-500"
              >
                Deselect all
              </button>
            )}
          </div>
        )}

        {/* Student table */}
        {source !== "csv" && (
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    <th className="w-8 px-3 py-2"></th>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-t border-gray-50 dark:border-slate-800/60 ${
                        selectedStudentIds.has(s.id)
                          ? "bg-brand-50/40 dark:bg-brand-500/5"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="cursor-pointer rounded border-gray-300 accent-brand-600 dark:border-slate-600"
                          checked={selectedStudentIds.has(s.id)}
                          onChange={() => onToggleStudent(s.id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">{s.email ?? "—"}</p>
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-slate-300">{s.phone ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE[s.activeStatus] ?? ""}`}>
                          {s.activeStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-400 dark:text-slate-500">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CSV recipients table */}
        {source === "csv" && csvRecipients.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="w-8 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {csvRecipients.map((r, i) => (
                    <tr key={i} className="border-t border-gray-50 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{r.name}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-slate-300">{r.phone || "—"}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-slate-300">{r.email || "—"}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => onRemoveCsvRecipient(i)}
                          className="rounded p-0.5 text-gray-400 hover:text-red-500 dark:text-slate-500"
                        >
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {source !== "csv" && filteredStudents.length === 0 && (
          <div className="py-8 text-center">
            <Users size={28} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No students</p>
          </div>
        )}
        {source === "csv" && csvRecipients.length === 0 && (
          <div className="py-8 text-center">
            <FileCsv size={28} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No CSV data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
