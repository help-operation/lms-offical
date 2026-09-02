"use client";

import { useMemo } from "react";
import {
  CaretDoubleLeft, CaretLeft, CaretRight, CaretDoubleRight,
} from "@phosphor-icons/react";
import type { EnrichedStudent } from "./types";

const PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  due: "bg-red-100 text-red-600",
};

const ACTIVE_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
};

const ENROLLMENT_BADGE: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-teal-100 text-teal-700",
  suspended: "bg-red-100 text-red-600",
  refunded: "bg-gray-100 text-gray-600",
  none: "bg-gray-100 text-gray-500",
};

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function StudentTable({
  students,
  page,
  pageSize,
  pageSizeInput,
  selected,
  allOnPageSelected,
  onPageChange,
  onPageSizeChange,
  onPageSizeInputChange,
  onApplyCustomPageSize,
  onToggleOne,
  onToggleAllOnPage,
  onSelectRow,
}: {
  students: EnrichedStudent[];
  page: number;
  pageSize: number;
  pageSizeInput: string;
  selected: Set<number>;
  allOnPageSelected: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: number) => void;
  onPageSizeInputChange: (v: string) => void;
  onApplyCustomPageSize: () => void;
  onToggleOne: (id: number) => void;
  onToggleAllOnPage: () => void;
  onSelectRow: (student: EnrichedStudent) => void;
}) {
  const totalItems = students.length;
  const showAll = pageSize === -1;
  const effectivePageSize = showAll ? Math.max(totalItems, 1) : pageSize;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = showAll
    ? students
    : students.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
  const displayFrom = totalItems === 0 ? 0 : showAll ? 1 : (currentPage - 1) * effectivePageSize + 1;
  const displayTo = showAll ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  const pageButtons = useMemo((): (number | "...")[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage, "...", totalPages];
  }, [totalPages, currentPage]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox" className="cursor-pointer rounded border-gray-300 dark:border-slate-600" checked={allOnPageSelected} onChange={onToggleAllOnPage} />
              </th>
              <th className="px-3 py-2.5 whitespace-nowrap">Student</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Course / Batch</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Payment</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Enrollment</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Registered</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Last login</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => (
              <tr
                key={s.id}
                onClick={() => onSelectRow(s)}
                className={`cursor-pointer border-b border-gray-50 last:border-0 transition-colors dark:border-slate-800/60 ${
                  selected.has(s.id) ? "bg-brand-50/40 dark:bg-brand-500/5" : "hover:bg-gray-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="cursor-pointer rounded border-gray-300 dark:border-slate-600" checked={selected.has(s.id)} onChange={() => onToggleOne(s.id)} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <p className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{s.phone ?? s.email ?? "—"}</p>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <p className="text-gray-700 dark:text-slate-300">{s.courseName}</p>
                  {s.courseType !== "none" && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {s.batchName ?? "Recorded"} · {s.courseType === "live" ? "Live" : "Recorded"}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${PAYMENT_BADGE[s.paymentStatus] ?? ""}`}>
                    {s.paymentStatus}
                  </span>
                  {s.dueAmount > 0 && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">BDT {s.dueAmount.toLocaleString()}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${ACTIVE_BADGE[s.activeStatus] ?? ""}`}>
                    {s.activeStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${ENROLLMENT_BADGE[s.enrollmentStatus] ?? ""}`}>
                    {s.enrollmentStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{fmtDate(s.createdAt)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-slate-400">{fmtDate(s.lastLoginAt)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                  No students match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row">
        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <span className="text-xs">
              Showing {displayFrom}–{displayTo} of {totalItems} results
            </span>
          )}
          <select
            value={showAll ? "all" : [10, 20, 50, 100].includes(pageSize) ? pageSize : "custom"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") onPageSizeChange(-1);
              else if (v !== "custom") onPageSizeChange(Number(v));
            }}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s} / page</option>)}
            <option value="custom">Custom...</option>
            <option value="all">All ({totalItems})</option>
          </select>
          <input
            type="number"
            min={1}
            value={pageSizeInput}
            onChange={(e) => onPageSizeInputChange(e.target.value)}
            onBlur={onApplyCustomPageSize}
            onKeyDown={(e) => e.key === "Enter" && onApplyCustomPageSize()}
            placeholder="Custom"
            className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <CaretDoubleLeft size={13} />
          </button>
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <CaretLeft size={13} />
          </button>
          {pageButtons.map((pg, idx) =>
            pg === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 dark:text-slate-500">...</span>
            ) : (
              <button
                key={pg}
                onClick={() => onPageChange(pg)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                  currentPage === pg
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {pg}
              </button>
            ),
          )}
          <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <CaretRight size={13} />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <CaretDoubleRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
