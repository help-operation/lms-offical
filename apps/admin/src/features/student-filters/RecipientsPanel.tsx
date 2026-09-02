"use client";

import { useCallback, useRef, useState } from "react";
import {
  X, Upload, Download, Users, WarningCircle, FileCsv, Trash,
} from "@phosphor-icons/react";
import { parseCsv, csvTemplate, type CsvRecipient } from "./csv-parser";
import type { EnrichedStudent } from "./types";

export type Recipient = {
  id: string;
  phone: string;
  email: string;
  name: string;
  source: "student" | "csv";
};

export function RecipientsPanel({
  selectedStudents,
  csvRecipients,
  onRemoveStudent,
  onClearStudents,
  onAddCsvRecipients,
  onRemoveCsvRecipient,
  onClearCsv,
}: {
  selectedStudents: EnrichedStudent[];
  csvRecipients: CsvRecipient[];
  onRemoveStudent: (id: number) => void;
  onClearStudents: () => void;
  onAddCsvRecipients: (recipients: CsvRecipient[]) => void;
  onRemoveCsvRecipient: (index: number) => void;
  onClearCsv: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

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

  const totalRecipients = selectedStudents.length + csvRecipients.length;

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
            {totalRecipients}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                From Students ({selectedStudents.length})
              </p>
              <button
                onClick={onClearStudents}
                className="text-xs text-gray-400 hover:text-red-500 dark:text-slate-500"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1.5">
              {selectedStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">
                      {s.phone ?? s.email ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveStudent(s.id)}
                    className="ml-2 shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 dark:text-slate-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSV Upload */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
            Upload CSV
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-brand-500"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={20} className="mx-auto mb-1.5 text-gray-400 dark:text-slate-500" />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Drop CSV here or <span className="font-medium text-brand-600 dark:text-brand-400">browse</span>
            </p>
            <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">
              phone, email, name columns
            </p>
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
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400"
            >
              <Download size={11} /> Download template
            </button>
          </div>
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-500/10">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <WarningCircle size={13} weight="fill" /> Import warnings
            </p>
            <div className="max-h-24 overflow-y-auto">
              {parseErrors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-[11px] text-amber-600/80 dark:text-amber-400/80">{err}</p>
              ))}
              {parseErrors.length > 10 && (
                <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">...and {parseErrors.length - 10} more</p>
              )}
            </div>
          </div>
        )}

        {/* CSV Recipients */}
        {csvRecipients.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                From CSV ({csvRecipients.length})
              </p>
              <button
                onClick={onClearCsv}
                className="text-xs text-gray-400 hover:text-red-500 dark:text-slate-500"
              >
                Clear
              </button>
            </div>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {csvRecipients.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-900 dark:text-white">{r.name}</p>
                    <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">
                      {r.phone || r.email}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveCsvRecipient(i)}
                    className="ml-2 shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 dark:text-slate-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalRecipients === 0 && (
          <div className="py-8 text-center">
            <FileCsv size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No recipients yet</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Select students from the table or upload a CSV
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
