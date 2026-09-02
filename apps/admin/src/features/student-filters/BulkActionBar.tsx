"use client";

import { PaperPlaneTilt, EnvelopeSimple, X, CheckSquare } from "@phosphor-icons/react";

export function BulkActionBar({
  count,
  onSendSms,
  onSendEmail,
  onClear,
}: {
  count: number;
  onSendSms: () => void;
  onSendEmail: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} weight="fill" className="text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            <span className="font-bold">{count}</span> student{count !== 1 ? "s" : ""} selected
          </span>
        </div>

        <span className="h-5 w-px bg-gray-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <button
            onClick={onSendSms}
            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-green-700"
          >
            <PaperPlaneTilt size={13} weight="fill" /> Send SMS
          </button>
          <button
            onClick={onSendEmail}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <EnvelopeSimple size={13} weight="fill" /> Send Email
          </button>
        </div>

        <button
          onClick={onClear}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Clear selection"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
