"use client";

import { useState } from "react";
import {
  MagnifyingGlass, FunnelSimple, X, ArrowClockwise, CaretDown, CaretUp,
} from "@phosphor-icons/react";
import type { Filters, EnrichedStudent } from "./types";

const inputCls =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 " +
  "focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 " +
  "dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40";

const QUICK_FILTERS: { label: string; key: string; value: string }[] = [
  { label: "All Students", key: "", value: "" },
  { label: "New Students", key: "enrollmentStatus", value: "none" },
  { label: "Payment Due", key: "paymentStatus", value: "due" },
  { label: "Inactive", key: "activeStatus", value: "inactive" },
  { label: "No Enrollment", key: "enrollmentStatus", value: "none" },
  { label: "Never Logged In", key: "lastLoginFrom", value: "__never__" },
];

export function StudentFilterBar({
  filters,
  onFilter,
  onReset,
  allCourseNames,
  allBatchNames,
}: {
  filters: Filters;
  onFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  allCourseNames: string[];
  allBatchNames: string[];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvancedFilters =
    filters.courseName || filters.batchName || filters.courseType ||
    filters.registeredFrom || filters.registeredTo ||
    filters.lastLoginFrom || filters.lastLoginTo;

  const activeQuickFilter = QUICK_FILTERS.find(
    (q) => q.key === "" ? !filters.courseName && !filters.batchName && !filters.courseType && !filters.paymentStatus && !filters.activeStatus && !filters.enrollmentStatus && !filters.registeredFrom && !filters.registeredTo && !filters.lastLoginFrom && !filters.lastLoginTo && !filters.search
      : q.key === "lastLoginFrom" && q.value === "__never__"
        ? filters.lastLoginFrom === "__never__"
        : filters[q.key as keyof Filters] === q.value
  );

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilter("search", e.target.value)}
          placeholder="Search students by name, phone, or email..."
          className={`w-full pl-10 pr-4 ${inputCls}`}
        />
        {filters.search && (
          <button onClick={() => onFilter("search", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FunnelSimple size={14} className="text-gray-400" />
        {QUICK_FILTERS.map((q) => {
          const isActive = activeQuickFilter?.label === q.label;
          return (
            <button
              key={q.label}
              onClick={() => {
                if (q.key === "") {
                  onReset();
                } else if (q.key === "lastLoginFrom" && q.value === "__never__") {
                  onFilter("lastLoginFrom", "__never__");
                  onFilter("lastLoginTo", "");
                } else {
                  onFilter(q.key as keyof Filters, q.value as any);
                }
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {q.label}
            </button>
          );
        })}

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {showAdvanced ? <CaretUp size={12} /> : <CaretDown size={12} />}
          Advanced{hasAdvancedFilters ? " *" : ""}
        </button>
      </div>

      {/* Advanced filters (progressive disclosure) */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-3 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Course</label>
            <select className={`w-full ${inputCls}`} value={filters.courseName} onChange={(e) => onFilter("courseName", e.target.value)}>
              <option value="">All courses</option>
              {allCourseNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Batch</label>
            <select className={`w-full ${inputCls}`} value={filters.batchName} onChange={(e) => onFilter("batchName", e.target.value)}>
              <option value="">All batches</option>
              {allBatchNames.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Course type</label>
            <select className={`w-full ${inputCls}`} value={filters.courseType} onChange={(e) => onFilter("courseType", e.target.value as Filters["courseType"])}>
              <option value="">Live / Recorded</option>
              <option value="live">Live only</option>
              <option value="recorded">Recorded only</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Payment</label>
            <select className={`w-full ${inputCls}`} value={filters.paymentStatus} onChange={(e) => onFilter("paymentStatus", e.target.value as Filters["paymentStatus"])}>
              <option value="">All payment status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Account status</label>
            <select className={`w-full ${inputCls}`} value={filters.activeStatus} onChange={(e) => onFilter("activeStatus", e.target.value as Filters["activeStatus"])}>
              <option value="">Active / Inactive</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Enrollment</label>
            <select className={`w-full ${inputCls}`} value={filters.enrollmentStatus} onChange={(e) => onFilter("enrollmentStatus", e.target.value as Filters["enrollmentStatus"])}>
              <option value="">All enrollment status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
              <option value="refunded">Refunded</option>
              <option value="none">No enrollment</option>
            </select>
          </div>

          {/* Date ranges */}
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-3 lg:col-span-6 lg:flex-row lg:gap-4 lg:border-t lg:border-gray-200 lg:pt-3 lg:dark:border-slate-700">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Registration date</label>
              <div className="flex items-center gap-2">
                <input type="date" className={inputCls} value={filters.registeredFrom} onChange={(e) => onFilter("registeredFrom", e.target.value)} />
                <span className="text-xs text-gray-400">to</span>
                <input type="date" className={inputCls} value={filters.registeredTo} onChange={(e) => onFilter("registeredTo", e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Last login</label>
              <div className="flex items-center gap-2">
                <input type="date" className={inputCls} value={filters.lastLoginFrom === "__never__" ? "" : filters.lastLoginFrom} onChange={(e) => onFilter("lastLoginFrom", e.target.value)} />
                <span className="text-xs text-gray-400">to</span>
                <input type="date" className={inputCls} value={filters.lastLoginTo} onChange={(e) => onFilter("lastLoginTo", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-3 lg:col-span-6">
            <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-white dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              <ArrowClockwise size={13} /> Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
