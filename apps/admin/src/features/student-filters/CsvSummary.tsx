"use client";

import { WarningCircle, CheckCircle, XCircle, Copy } from "@phosphor-icons/react";
import type { CsvParseResult } from "./csv-parser";

export function CsvSummary({ result }: { result: CsvParseResult }) {
  return (
    <div className="space-y-2">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <Stat icon={<CheckCircle size={12} weight="fill" className="text-green-500" />} label="Valid" value={result.validRecipients} />
        {result.duplicateCount > 0 && (
          <Stat icon={<Copy size={12} weight="fill" className="text-amber-500" />} label="Duplicates" value={result.duplicateCount} />
        )}
        {result.invalidCount > 0 && (
          <Stat icon={<XCircle size={12} weight="fill" className="text-red-500" />} label="Invalid" value={result.invalidCount} />
        )}
      </div>

      {/* Duplicate details */}
      {result.duplicateDetails.length > 0 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-2 dark:border-amber-900/40 dark:bg-amber-500/10">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            <Copy size={11} weight="fill" /> Duplicate phones detected
          </p>
          <div className="max-h-16 overflow-y-auto space-y-0.5">
            {result.duplicateDetails.slice(0, 5).map((d, i) => (
              <p key={i} className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                {d.phone} — {d.count}× (rows {d.rows.join(", ")})
              </p>
            ))}
            {result.duplicateDetails.length > 5 && (
              <p className="text-[10px] text-amber-600/80">+{result.duplicateDetails.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-slate-400">
            <WarningCircle size={11} weight="fill" /> {result.warnings.length} warnings
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {result.warnings.slice(0, 2).join("; ")}{result.warnings.length > 2 ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {icon} {value} {label}
    </span>
  );
}
