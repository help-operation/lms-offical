"use client";

import { X } from "@phosphor-icons/react";
import type { Filters } from "./types";

const FILTER_LABELS: Record<string, string> = {
  courseName: "Course",
  batchName: "Batch",
  courseType: "Type",
  paymentStatus: "Payment",
  activeStatus: "Status",
  enrollmentStatus: "Enrollment",
  registeredFrom: "Registered from",
  registeredTo: "Registered to",
  lastLoginFrom: "Last login from",
  lastLoginTo: "Last login to",
};

export function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: Filters;
  onRemove: (key: keyof Filters) => void;
  onClearAll: () => void;
}) {
  const chips: { key: keyof Filters; label: string; value: string }[] = [];

  if (filters.courseName) chips.push({ key: "courseName", label: "Course", value: filters.courseName });
  if (filters.batchName) chips.push({ key: "batchName", label: "Batch", value: filters.batchName });
  if (filters.courseType) chips.push({ key: "courseType", label: "Type", value: filters.courseType });
  if (filters.paymentStatus) chips.push({ key: "paymentStatus", label: "Payment", value: filters.paymentStatus });
  if (filters.activeStatus) chips.push({ key: "activeStatus", label: "Status", value: filters.activeStatus });
  if (filters.enrollmentStatus) chips.push({ key: "enrollmentStatus", label: "Enrollment", value: filters.enrollmentStatus });
  if (filters.registeredFrom) chips.push({ key: "registeredFrom", label: "Reg. from", value: filters.registeredFrom });
  if (filters.registeredTo) chips.push({ key: "registeredTo", label: "Reg. to", value: filters.registeredTo });
  if (filters.lastLoginFrom && filters.lastLoginFrom !== "__never__") chips.push({ key: "lastLoginFrom", label: "Login from", value: filters.lastLoginFrom });
  if (filters.lastLoginFrom === "__never__") chips.push({ key: "lastLoginFrom", label: "Last login", value: "Never logged in" });
  if (filters.lastLoginTo) chips.push({ key: "lastLoginTo", label: "Login to", value: filters.lastLoginTo });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
        >
          <span className="text-brand-500 dark:text-brand-400">{chip.label}:</span>
          {chip.value}
          <button onClick={() => onRemove(chip.key)} className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900/30">
            <X size={10} />
          </button>
        </span>
      ))}
      <button onClick={onClearAll} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300">
        Clear all
      </button>
    </div>
  );
}
