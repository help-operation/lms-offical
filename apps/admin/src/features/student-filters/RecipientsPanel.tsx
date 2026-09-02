"use client";

import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import {
  X, Upload, Download, Users, WarningCircle, FileCsv, CaretDown, MagnifyingGlass, Clock, Trash, SpinnerGap,
} from "@phosphor-icons/react";
import { parseCsv, csvTemplate, type CsvRecipient, type CsvParseResult } from "./csv-parser";
import { getSavedCsvs, saveCsvEntry, deleteSavedCsv, type SavedCsv } from "./csv-history";
import { CsvSummary } from "./CsvSummary";
import type { EnrichedStudent } from "./types";

const selectCls =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 outline-none appearance-none " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500";

const inputCls =
  "rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 outline-none " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500";

type SourceType = "all" | "batch" | "course" | "visited" | "not_enrolled" | "age" | "csv";

const SOURCE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "all", label: "All Students" },
  { value: "batch", label: "Batch Wise" },
  { value: "course", label: "Course Wise" },
  { value: "visited", label: "Visited Course" },
  { value: "not_enrolled", label: "Not Enrolled" },
  { value: "age", label: "Age Wise" },
  { value: "csv", label: "CSV Upload" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

function getAgeFromCreatedAt(createdAt: string | null): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(diffYears);
}

export function RecipientsPanel({
  allStudents,
  allStudentsLoading,
  selectedStudentIds,
  csvRecipients,
  onToggleStudent,
  onSelectAll,
  onDeselectAll,
  onAddCsvRecipients,
  onRemoveCsvRecipient,
  onClearCsv,
}: {
  allStudents: EnrichedStudent[];
  allStudentsLoading: boolean;
  selectedStudentIds: Set<number>;
  csvRecipients: CsvRecipient[];
  onToggleStudent: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onDeselectAll: () => void;
  onAddCsvRecipients: (recipients: CsvRecipient[]) => void;
  onRemoveCsvRecipient: (index: number) => void;
  onClearCsv: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<SourceType>("all");
  const [search, setSearch] = useState("");

  // Filters — ALL sources get date range
  const [batchFilter, setBatchFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Age filter
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  // CSV state
  const [csvResult, setCsvResult] = useState<CsvParseResult | null>(null);
  const [savedCsvs, setSavedCsvs] = useState<SavedCsv[]>([]);
  const [csvTab, setCsvTab] = useState<"upload" | "history">("upload");

  useEffect(() => {
    setSavedCsvs(getSavedCsvs());
  }, []);

  // Derive batch names and course names from all students
  const allBatchNames = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.batchName).filter((b): b is string => !!b))),
    [allStudents],
  );
  const allCourseNames = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.courseName).filter((c) => c !== "No enrollment"))),
    [allStudents],
  );

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    let list = allStudents;

    switch (source) {
      case "batch":
        if (batchFilter) list = list.filter((s) => s.batchName === batchFilter);
        break;
      case "course":
        if (courseFilter) list = list.filter((s) => s.courseName === courseFilter);
        break;
      case "visited":
        list = list.filter((s) => s.hasRealEnrollment);
        if (courseFilter) list = list.filter((s) => s.courseName === courseFilter);
        break;
      case "not_enrolled":
        // Students without active enrollment (enrollmentStatus === "none")
        list = list.filter((s) => !s.hasRealEnrollment || s.enrollmentStatus === "none");
        if (courseFilter) list = list.filter((s) => s.courseName === courseFilter);
        break;
      case "age": {
        // Filter by account age (years since registration)
        const minAge = ageMin ? parseInt(ageMin, 10) : 0;
        const maxAge = ageMax ? parseInt(ageMax, 10) : 999;
        list = list.filter((s) => {
          const age = getAgeFromCreatedAt(s.createdAt);
          if (age === null) return false;
          return age >= minAge && age <= maxAge;
        });
        break;
      }
      // "all" and "csv" — no additional filtering (csv handled separately)
    }

    // ── Date range filter — applies to ALL non-CSV sources ──────────────────
    if (source !== "csv") {
      if (dateFrom) {
        list = list.filter((s) => {
          const d = s.createdAt ?? s.lastLoginAt;
          return d && d >= dateFrom;
        });
      }
      if (dateTo) {
        const toEnd = dateTo + "T23:59:59";
        list = list.filter((s) => {
          const d = s.createdAt ?? s.lastLoginAt;
          return d && d <= toEnd;
        });
      }
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.phone ?? ""} ${s.email ?? ""}`.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allStudents, source, batchFilter, courseFilter, dateFrom, dateTo, ageMin, ageMax, search]);

  const visibleIds = useMemo(() => filteredStudents.map((s) => s.id), [filteredStudents]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.has(id));
  const totalRecipients = selectedStudentIds.size + csvRecipients.length;

  // ── CSV handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseCsv(text);
        setCsvResult(result);

        const nonDuplicateRecipients = result.recipients.filter((r) => !r.isDuplicate);
        saveCsvEntry({
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          totalRows: result.totalRows,
          validRecipients: result.validRecipients,
          duplicateCount: result.duplicateCount,
          recipients: nonDuplicateRecipients,
        });
        setSavedCsvs(getSavedCsvs());

        if (nonDuplicateRecipients.length > 0) {
          onAddCsvRecipients(nonDuplicateRecipients);
        }
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

  function loadSavedCsv(saved: SavedCsv) {
    onAddCsvRecipients(saved.recipients);
    setCsvTab("upload");
  }

  function handleDeleteSaved(id: string) {
    deleteSavedCsv(id);
    setSavedCsvs(getSavedCsvs());
  }

  function resetFilters() {
    setBatchFilter("");
    setCourseFilter("");
    setDateFrom("");
    setDateTo("");
    setAgeMin("");
    setAgeMax("");
    setSearch("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Source + Search row */}
      <div className="flex items-end gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Source</label>
          <div className="relative">
            <select value={source} onChange={(e) => { setSource(e.target.value as SourceType); resetFilters(); }} className={`${selectCls} pr-6`}>
              {SOURCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <CaretDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="flex-[2]">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">Search</label>
          <div className="relative">
            <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, or email…" className={`w-full pl-8 ${inputCls}`} />
          </div>
        </div>
      </div>

      {/* ── Dynamic sub-filters ──────────────────────────────────────────────── */}
      {source !== "csv" && (
        <div className="border-b border-gray-100 px-4 py-2.5 dark:border-slate-800">
          {source === "all" && (
            <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} inputCls={inputCls} />
          )}

          {source === "batch" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Batch</label>
                <div className="relative">
                  <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className={`${selectCls} pr-6`}>
                    <option value="">All batches</option>
                    {allBatchNames.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <CaretDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <DateRangeFilterInline dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} inputCls={inputCls} />
            </div>
          )}

          {source === "course" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Course</label>
                <div className="relative">
                  <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={`${selectCls} pr-6`}>
                    <option value="">All courses</option>
                    {allCourseNames.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <CaretDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <DateRangeFilterInline dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} inputCls={inputCls} />
            </div>
          )}

          {source === "visited" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Course</label>
                <div className="relative">
                  <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={`${selectCls} pr-6`}>
                    <option value="">All courses</option>
                    {allCourseNames.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <CaretDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <DateRangeFilterInline dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} inputCls={inputCls} />
            </div>
          )}

          {source === "not_enrolled" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Course</label>
                <div className="relative">
                  <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={`${selectCls} pr-6`}>
                    <option value="">All courses</option>
                    {allCourseNames.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <CaretDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <DateRangeFilterInline dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} inputCls={inputCls} />
            </div>
          )}

          {source === "age" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Account Age (years)</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={0} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="Min" className={`flex-1 ${inputCls}`} />
                  <span className="text-[10px] text-gray-400">–</span>
                  <input type="number" min={0} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="Max" className={`flex-1 ${inputCls}`} />
                </div>
              </div>
              <DateRangeFilterInline dateFrom={dateFrom} dateTo={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} inputCls={inputCls} />
            </div>
          )}
        </div>
      )}

      {/* ── CSV Upload section ───────────────────────────────────────────────── */}
      {source === "csv" && (
        <div className="border-b border-gray-100 dark:border-slate-800">
          <div className="flex border-b border-gray-100 dark:border-slate-800">
            <button onClick={() => setCsvTab("upload")} className={`flex-1 py-2 text-[11px] font-medium transition-colors ${csvTab === "upload" ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-400 hover:text-gray-600"}`}>
              <Upload size={11} className="mr-1 inline" /> Upload
            </button>
            <button onClick={() => setCsvTab("history")} className={`flex-1 py-2 text-[11px] font-medium transition-colors ${csvTab === "history" ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-400 hover:text-gray-600"}`}>
              <Clock size={11} className="mr-1 inline" /> History {savedCsvs.length > 0 && `(${savedCsvs.length})`}
            </button>
          </div>

          {csvTab === "upload" ? (
            <div className="p-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-3 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/60"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} className="mx-auto mb-1 text-gray-400" />
                <p className="text-[11px] text-gray-500">Drop CSV or <span className="font-medium text-brand-600">browse</span></p>
                <p className="mt-0.5 text-[10px] text-gray-400">name, phone, email columns</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              <div className="mt-2 flex items-center justify-between">
                <button onClick={() => { const b = new Blob([csvTemplate()], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "recipients-template.csv"; a.click(); URL.revokeObjectURL(u); }} className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-brand-600">
                  <Download size={9} /> Template
                </button>
              </div>
              {csvResult && <div className="mt-3"><CsvSummary result={csvResult} /></div>}
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              {savedCsvs.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-gray-400">No saved CSVs yet</div>
              ) : (
                savedCsvs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between border-b border-gray-50 px-4 py-2 dark:border-slate-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/40">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-gray-900 dark:text-white">{s.fileName}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        {new Date(s.uploadedAt).toLocaleDateString()} · {s.validRecipients} recipients{s.duplicateCount > 0 && ` · ${s.duplicateCount} dupes`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => loadSavedCsv(s)} className="rounded-md bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400">
                        Use
                      </button>
                      <button onClick={() => handleDeleteSaved(s.id)} className="rounded-md p-1 text-gray-400 hover:text-red-500">
                        <Trash size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Select all bar ───────────────────────────────────────────────────── */}
      {source !== "csv" && (
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 dark:border-slate-800">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="cursor-pointer rounded border-gray-300 accent-brand-600 dark:border-slate-600"
              checked={allVisibleSelected}
              onChange={() => {
                if (allVisibleSelected) visibleIds.forEach((id) => { if (selectedStudentIds.has(id)) onToggleStudent(id); });
                else onSelectAll(visibleIds);
              }}
            />
            Select all ({filteredStudents.length})
          </label>
          {selectedStudentIds.size > 0 && (
            <button onClick={onDeselectAll} className="text-[10px] text-gray-400 hover:text-red-500">Clear</button>
          )}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {allStudentsLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <SpinnerGap size={24} className="mb-2 animate-spin text-brand-500" />
            <p className="text-xs text-gray-400">Loading students from database…</p>
          </div>
        ) : source !== "csv" ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800">
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                <th className="w-8 px-3 py-2"></th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} onClick={() => onToggleStudent(s.id)} className={`cursor-pointer border-t border-gray-50 transition-colors dark:border-slate-800/60 ${selectedStudentIds.has(s.id) ? "bg-brand-50/50 dark:bg-brand-500/5" : "hover:bg-gray-50 dark:hover:bg-slate-800/40"}`}>
                  <td className="px-3 py-2"><input type="checkbox" className="cursor-pointer rounded border-gray-300 accent-brand-600 dark:border-slate-600" checked={selectedStudentIds.has(s.id)} onChange={() => onToggleStudent(s.id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{s.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{s.email ?? "—"}</td>
                  <td className="px-3 py-2"><span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE[s.activeStatus] ?? ""}`}>{s.activeStatus}</span></td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                  {allStudents.length === 0 ? "No students in database" : "No students match the current filters"}
                </td></tr>
              )}
            </tbody>
          </table>
        ) : csvRecipients.length > 0 ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800">
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Email</th>
                <th className="w-8 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {csvRecipients.map((r, i) => (
                <tr key={r.id ?? i} className="border-t border-gray-50 hover:bg-gray-50 dark:border-slate-800/60">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{r.name}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{r.phone || "—"}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{r.email || "—"}</td>
                  <td className="px-3 py-2"><button onClick={() => onRemoveCsvRecipient(i)} className="rounded p-0.5 text-gray-400 hover:text-red-500"><X size={11} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-10 text-center">
            <FileCsv size={28} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-400">Upload a CSV or load from history</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable sub-filter components ──────────────────────────────────────────────

function DateRangeFilter({
  dateFrom, dateTo, onFromChange, onToChange, inputCls,
}: {
  dateFrom: string; dateTo: string;
  onFromChange: (v: string) => void; onToChange: (v: string) => void;
  inputCls: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">From</label>
        <input type="date" value={dateFrom} onChange={(e) => onFromChange(e.target.value)} className={`w-full ${inputCls}`} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">To</label>
        <input type="date" value={dateTo} onChange={(e) => onToChange(e.target.value)} className={`w-full ${inputCls}`} />
      </div>
    </div>
  );
}

function DateRangeFilterInline({
  dateFrom, dateTo, onFromChange, onToChange, inputCls,
}: {
  dateFrom: string; dateTo: string;
  onFromChange: (v: string) => void; onToChange: (v: string) => void;
  inputCls: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-slate-400">Date Range</label>
      <div className="flex items-center gap-1">
        <input type="date" value={dateFrom} onChange={(e) => onFromChange(e.target.value)} className={`flex-1 ${inputCls}`} />
        <span className="text-[10px] text-gray-400">–</span>
        <input type="date" value={dateTo} onChange={(e) => onToChange(e.target.value)} className={`flex-1 ${inputCls}`} />
      </div>
    </div>
  );
}
