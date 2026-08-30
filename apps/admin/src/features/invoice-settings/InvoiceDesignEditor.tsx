"use client";

import { useState, useTransition } from "react";
import {
  FloppyDisk, SpinnerGap, CheckCircle, Check,
  File,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";
import { InvoiceHtmlTemplate, INVOICE_PAGE_SIZES, type InvoiceBrandSettings, type InvoicePageFormat } from "@/features/invoices/InvoiceHtmlTemplate";
import { INVOICE_TEMPLATES } from "@/features/invoices/templates/registry";
import { updateInvoiceDesignSettingsAction, type InvoiceDesignSettings } from "./style-overrides-actions";
import { MOCK_INVOICE } from "./mock-invoice";

interface Props {
  initial: InvoiceDesignSettings;
  brand: InvoiceBrandSettings;
}

const PAGE_FORMATS: { value: InvoicePageFormat; label: string; dimensions: string }[] = [
  { value: "a4", label: "A4", dimensions: "210 × 297 mm" },
  { value: "a5", label: "A5", dimensions: "148 × 210 mm" },
];

export function InvoiceDesignEditor({ initial, brand }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState(initial.selectedTemplate);
  const [overridesByTemplate, setOverridesByTemplate] = useState(initial.overridesByTemplate);
  const [pageFormat, setPageFormat] = useState<InvoicePageFormat>(initial.pageFormat);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const currentOverrides = overridesByTemplate[selectedTemplate] ?? {};

  function markDirty() {
    setSaved(false);
  }

  function handleSelectTemplate(templateId: string) {
    setSelectedTemplate(templateId);
    markDirty();
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateInvoiceDesignSettingsAction({ selectedTemplate, overridesByTemplate, pageFormat });
      if (res.success) {
        setSaved(true);
        toast.success("Invoice design saved");
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  const selectedName = INVOICE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ?? "Classic";
  const currentPage = INVOICE_PAGE_SIZES[pageFormat];

  return (
    <div className="space-y-6">
      {/* Template gallery — 3 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {INVOICE_TEMPLATES.map((tpl) => {
          const active = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-white dark:bg-gray-800 p-4 text-left transition-all ${
                active
                  ? "border-purple-500 shadow-md ring-1 ring-purple-200 dark:ring-purple-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {active && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white">
                  <Check size={14} weight="bold" />
                </span>
              )}
              <div className="flex h-16 overflow-hidden rounded-xl">
                {tpl.previewColors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{tpl.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{tpl.description}</p>
            </button>
          );
        })}
      </div>

      {/* Editing bar with page format selector */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Editing <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedName}</span> — This design applies to every invoice site-wide.
        </p>

        {/* Page Format Selector */}
        <div className="flex items-center gap-2">
          <File size={14} className="text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Page Size:</span>
          <div className="flex gap-1">
            {PAGE_FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => { setPageFormat(fmt.value); markDirty(); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pageFormat === fmt.value
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">
            ({currentPage.label})
          </span>
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live Preview</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">This is how your invoice will look ({currentPage.label})</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 sm:p-6">
          <div className="mx-auto shadow-lg" style={{ minWidth: Math.min(currentPage.width, 700) }}>
            <InvoiceHtmlTemplate
              invoice={MOCK_INVOICE}
              brand={brand}
              overrides={currentOverrides}
              templateId={selectedTemplate}
              pageFormat={pageFormat}
            />
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedName}</span> · <span className="font-medium">{currentPage.label}</span> selected
        </p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 transition-colors"
        >
          {isPending ? (
            <SpinnerGap size={15} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={15} weight="fill" />
          ) : (
            <FloppyDisk size={15} weight="bold" />
          )}
          {saved && !isPending ? "Saved" : "Save Design"}
        </button>
      </div>
    </div>
  );
}
