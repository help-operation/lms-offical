"use client";

import { useEffect, useRef, useState } from "react";
import {
  Columns,
  Check,
  ChevronDown,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Loader2,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import type { ExportField, CompanyInfo } from "@/utils/table-export";
import { exportTableAsCsv, exportTableAsXlsx, exportTableAsPdf, settingsToCompanyInfo } from "@/utils/table-export";
import { getGeneralSettingsAction, fetchLogoBase64Action } from "@/features/general-settings/actions";

// ─── ColDef ──────────────────────────────────────────────────────────────────

export interface ColDef<T> {
  key: string;
  header: string;
  defaultVisible?: boolean;
  exportFields?: ExportField<T>[];
}

// ─── ColumnsDropdown ──────────────────────────────────────────────────────────

interface ColumnsDropdownProps {
  cols: Array<{ key: string; header: string }>;
  visible: Set<string>;
  onChange: (visible: Set<string>) => void;
}

export function ColumnsDropdown({ cols, visible, onChange }: ColumnsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(key: string) {
    const next = new Set(visible);
    if (next.has(key)) {
      if (next.size <= 1) return; // always keep at least one
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Columns className="h-4 w-4 text-gray-500 dark:text-slate-400" />
        Columns
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[13rem] overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl dark:shadow-none">
          <p className="px-3.5 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
            Toggle columns
          </p>
          <div className="py-1">
            {cols.map((col) => {
              const isOn = visible.has(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggle(col.key)}
                  className="flex w-full items-center gap-3 px-3.5 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isOn
                        ? "border-brand-600 dark:border-brand bg-brand-600 dark:bg-brand"
                        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {isOn && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="whitespace-nowrap">{col.header}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExportDropdown ───────────────────────────────────────────────────────────

type ExportScope  = "page" | "all";
type ExportFormat = "csv" | "xlsx" | "pdf";

interface ExportDropdownProps<T> {
  /** Data currently visible on the current page */
  pageData: T[];
  /** Export fields for currently-visible columns */
  fields: ExportField<T>[];
  /** Optional: fetches all matching records for "All Data" export */
  fetchAll?: () => Promise<T[]>;
  filename: string;
  exportTitle: string;
}

export function ExportDropdown<T>({
  pageData,
  fields,
  fetchAll,
  filename,
  exportTitle,
}: ExportDropdownProps<T>) {
  const [open,     setOpen]     = useState(false);
  const [scope,    setScope]    = useState<ExportScope>("page");
  const [format,   setFormat]   = useState<ExportFormat>("csv");
  const [loading,  setLoading]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleExport() {
    if (fields.length === 0) { toast.error("No columns selected"); return; }
    setLoading(true);
    setOpen(false);
    try {
      // 1. Get data
      let data: T[];
      if (scope === "all" && fetchAll) {
        data = await fetchAll();
      } else {
        data = pageData;
      }

      if (data.length === 0) { toast.error("No data to export"); return; }

      // 2. Export
      if (format === "csv") {
        exportTableAsCsv(data, fields, filename);
        toast.success("CSV downloaded");
      } else if (format === "xlsx") {
        await exportTableAsXlsx(data, fields, filename);
        toast.success("XLSX downloaded");
      } else {
        // PDF — fetch company info + logo
        const settingsRes = await getGeneralSettingsAction();
        let company: CompanyInfo = {
          siteName: "", tagline: "", logoUrl: "", email: "", phone: "",
          phone2: "", whatsapp: "", address: "", tradeLicense: "", copyright: "",
        };
        let logoDataUrl: string | null = null;

        if (settingsRes.success) {
          company = settingsToCompanyInfo(settingsRes.data);
          if (company.logoUrl) {
            logoDataUrl = await fetchLogoBase64Action(company.logoUrl);
          }
        }

        await exportTableAsPdf(data, fields, company, logoDataUrl, filename, exportTitle);
        toast.success("PDF downloaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  const FORMATS: { key: ExportFormat; label: string; Icon: React.ElementType }[] = [
    { key: "csv",  label: "CSV",  Icon: FileText },
    { key: "xlsx", label: "XLSX", Icon: FileSpreadsheet },
    { key: "pdf",  label: "PDF",  Icon: File },
  ];

  const SCOPES: { key: ExportScope; label: string }[] = [
    { key: "page", label: "This Page" },
    { key: "all",  label: "All Data" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin text-brand-500 dark:text-brand" />
          : <Download className="h-4 w-4 text-gray-500 dark:text-slate-400" />
        }
        Export
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-3 space-y-3">

          {/* Scope */}
          {fetchAll && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Scope</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SCOPES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScope(s.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      scope === s.key
                        ? "bg-brand-600 dark:bg-brand text-white"
                        : "border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Format */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Format</p>
            <div className="grid grid-cols-3 gap-1.5">
              {FORMATS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormat(key)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                    format === key
                      ? "bg-brand-600 dark:bg-brand text-white"
                      : "border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          <button
            type="button"
            onClick={handleExport}
            className="w-full rounded-xl bg-brand-600 dark:bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors"
          >
            Download {format.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
