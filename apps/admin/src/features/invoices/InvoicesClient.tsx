"use client";

import { useState, useTransition, useCallback } from "react";
import { Download, Eye, X, CheckCircle, XCircle, Clock } from "lucide-react";
import { DataTable, type Column, type TablePagination, type TableQueryParams } from "@repo/ui/data-table";
import { toast } from "@repo/ui/sonner";
import type { Invoice, InvoicesResponse } from "@/features/invoices/api";
import { getInvoicesAction } from "./actions";
import { InvoiceHtmlTemplate, type InvoiceBrandSettings, type InvoicePageFormat } from "./InvoiceHtmlTemplate";
import { exportInvoiceToPdf } from "./export-invoice-pdf";
import type { InvoiceDesignSettings } from "@/features/invoice-settings/style-overrides-actions";
import { ColumnsDropdown, ExportDropdown, type ColDef } from "@/shared/components/TableControls";
import { formatDate } from "@/utils/table-export";

/** Resolves the site-wide template + its overrides — same design for every invoice type. */
function resolveDesign(design: InvoiceDesignSettings | undefined) {
  const templateId = design?.selectedTemplate ?? "classic";
  const overrides = design?.overridesByTemplate?.[templateId] ?? {};
  const pageFormat: InvoicePageFormat = design?.pageFormat ?? "a4";
  return { templateId, overrides, pageFormat };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined || amount === "") return "৳0";
  return `৳${Number(amount).toLocaleString("en-BD")}`;
}

function invoiceNum(inv: Invoice) {
  if (inv.displayInvoiceNumber) return inv.displayInvoiceNumber;
  if (inv.paystationInvoiceId) return inv.paystationInvoiceId;
  return `INV-${String(inv.paymentId).padStart(6, "0")}`;
}

function methodLabel(inv: Invoice) {
  if (inv.method === "bkash")      return "bKash";
  if (inv.method === "paystation") return inv.paystationMethod ?? "PayStation";
  if (inv.method === "free")       return "Free";
  return inv.method?.toUpperCase() ?? "—";
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
      <CheckCircle className="h-3 w-3" /> Paid
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
      <XCircle className="h-3 w-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

async function downloadInvoicePdf(invoice: Invoice, brand: InvoiceBrandSettings | undefined, design: InvoiceDesignSettings | undefined) {
  const { templateId, overrides, pageFormat } = resolveDesign(design);
  await exportInvoiceToPdf(invoice, brand, overrides, `${invoiceNum(invoice)}.pdf`, templateId, pageFormat);
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: ColDef<Invoice>[] = [
  {
    key: "invoice", header: "Invoice #", defaultVisible: true,
    exportFields: [{ header: "Invoice #", getValue: (inv) => invoiceNum(inv) }],
  },
  {
    key: "customer", header: "Customer", defaultVisible: true,
    exportFields: [
      { header: "Name",  getValue: (inv) => `${inv.firstName}${inv.lastName ? ` ${inv.lastName}` : ""}` },
      { header: "Email", getValue: (inv) => inv.email ?? "" },
      { header: "Phone", getValue: (inv) => inv.phone ?? "" },
    ],
  },
  {
    key: "courses", header: "Courses", defaultVisible: true,
    exportFields: [{ header: "Courses", getValue: (inv) => inv.items.map((i) => i.courseTitle).join(", ") }],
  },
  {
    key: "method", header: "Method", defaultVisible: true,
    exportFields: [{ header: "Payment Method", getValue: (inv) => methodLabel(inv) }],
  },
  {
    key: "amount", header: "Amount", defaultVisible: true,
    exportFields: [{ header: "Amount", getValue: (inv) => fmt(inv.finalAmount) }],
  },
  {
    key: "status", header: "Status", defaultVisible: true,
    exportFields: [{ header: "Status", getValue: (inv) => inv.status }],
  },
  {
    key: "date", header: "Date", defaultVisible: true,
    exportFields: [{ header: "Date", getValue: (inv) => formatDate(inv.paidAt ?? inv.createdAt) }],
  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLS.map((c) => c.key));

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoicesClient({
  initial,
  brand,
  design,
}: {
  initial: InvoicesResponse;
  brand?: InvoiceBrandSettings;
  design?: InvoiceDesignSettings;
}) {
  const [data,        setData]        = useState<Invoice[]>(initial.data);
  const [stats,       setStats]       = useState(initial.stats);
  const [pagination,  setPagination]  = useState<TablePagination>(initial.pagination as unknown as TablePagination);
  const [isLoading,   setIsLoading]   = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [currentParams, setCurrentParams] = useState<TableQueryParams>({ page: 1, per_page: 20 });
  const [visibleCols, setVisibleCols] = useState<Set<string>>(DEFAULT_VISIBLE);
  const [, startTransition] = useTransition();

  const { templateId: viewTemplateId, overrides: viewOverrides, pageFormat: viewPageFormat } = resolveDesign(design);

  const load = useCallback((params: TableQueryParams) => {
    setCurrentParams(params);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const res = await getInvoicesAction({
          page: params.page, per_page: params.per_page,
          search: params.search as string | undefined,
          status: params.status as string | undefined,
        });
        if (res.success) {
          setData(res.data.data);
          setStats(res.data.stats);
          setPagination(res.data.pagination as unknown as TablePagination);
        }
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  async function handleDownload(inv: Invoice) {
    setDownloading(inv.paymentId);
    try {
      await downloadInvoicePdf(inv, brand, design);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setDownloading(null);
    }
  }

  const exportFields = ALL_COLS
    .filter((c) => visibleCols.has(c.key))
    .flatMap((c) => c.exportFields ?? []);

  async function fetchAllForExport(): Promise<Invoice[]> {
    const res = await getInvoicesAction({
      page: 1, per_page: 100000,
      search: currentParams.search as string | undefined,
      status: currentParams.status as string | undefined,
    });
    return res.success ? res.data.data : [];
  }

  const visibleColumns: Column<Invoice>[] = [
    ...(visibleCols.has("invoice") ? [{
      key: "invoice" as const, header: "Invoice #",
      render: (inv: Invoice) => <span className="font-mono text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">{invoiceNum(inv)}</span>,
    }] : []),
    ...(visibleCols.has("customer") ? [{
      key: "customer" as const, header: "Customer",
      render: (inv: Invoice) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-800 dark:text-white">{inv.firstName}{inv.lastName ? ` ${inv.lastName}` : ""}</span>
            {inv.type === "live" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Live</span>
            )}
            {inv.type === "shop" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 uppercase tracking-wide">Shop</span>
            )}
          </div>
          <div className="text-xs text-gray-400 dark:text-slate-500">{inv.email}</div>
          {inv.phone && <div className="text-xs text-gray-400 dark:text-slate-500">{inv.phone}</div>}
        </div>
      ),
    }] : []),
    ...(visibleCols.has("courses") ? [{
      key: "courses" as const, header: "Courses", className: "max-w-[200px]",
      render: (inv: Invoice) => inv.items.length === 0 ? (
        <span className="text-gray-400 dark:text-slate-500">—</span>
      ) : (
        <div>{inv.items.map((item) => (
          <div key={item.courseId} className="text-xs text-gray-600 dark:text-slate-300 truncate">{item.courseTitle}</div>
        ))}</div>
      ),
    }] : []),
    ...(visibleCols.has("method") ? [{
      key: "method" as const, header: "Method",
      render: (inv: Invoice) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-xs font-medium text-gray-600 dark:text-slate-300">{methodLabel(inv)}</span>
      ),
    }] : []),
    ...(visibleCols.has("amount") ? [{
      key: "amount" as const, header: "Amount",
      render: (inv: Invoice) => <span className="font-semibold text-gray-800 dark:text-white whitespace-nowrap">{fmt(inv.finalAmount)}</span>,
    }] : []),
    ...(visibleCols.has("status") ? [{
      key: "status" as const, header: "Status",
      render: (inv: Invoice) => <StatusBadge status={inv.status} />,
    }] : []),
    ...(visibleCols.has("date") ? [{
      key: "date" as const, header: "Date",
      render: (inv: Invoice) => <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{formatDate(inv.paidAt ?? inv.createdAt)}</span>,
    }] : []),
    {
      key: "actions", header: "",
      render: (inv: Invoice) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewingInvoice(inv)}
            className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <button
            onClick={() => handleDownload(inv)}
            disabled={downloading === inv.paymentId}
            className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand hover:text-brand-700 dark:hover:text-brand bg-brand-50 dark:bg-brand/10 hover:bg-brand-100 dark:hover:bg-brand/15 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading === inv.paymentId ? "Generating..." : "PDF"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: String(stats.total),   color: "text-gray-800 dark:text-white"   },
          { label: "Paid",           value: String(stats.paid),    color: "text-green-600 dark:text-green-400"  },
          { label: "Pending",        value: String(stats.pending), color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Total Revenue",  value: fmt(stats.revenue),    color: "text-brand-600 dark:text-brand" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none px-4 py-3">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Payment records and invoice downloads</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsDropdown
            cols={ALL_COLS.map((c) => ({ key: c.key, header: c.header }))}
            visible={visibleCols}
            onChange={setVisibleCols}
          />
          <ExportDropdown
            pageData={data}
            fields={exportFields}
            fetchAll={fetchAllForExport}
            filename={`invoices-${new Date().toISOString().slice(0, 10)}`}
            exportTitle="Invoices Export"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">All Invoices</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
          <DataTable
            data={data}
            columns={visibleColumns}
            serverSide
            pagination={pagination}
            isLoading={isLoading}
            dateRangeKey="createdAt"
            portalContainer={typeof document !== "undefined" ? document.getElementById("admin-dashboard-root") : undefined}
            searchable
            searchPlaceholder="Search by name, email, invoice #, course..."
            filters={[
              {
                key: "status",
                label: "All Status",
                options: [
                  { label: "Paid",    value: "completed" },
                  { label: "Pending", value: "pending"   },
                  { label: "Failed",  value: "failed"    },
                ],
              },
            ]}
            onQueryChange={load}
            emptyMessage="No invoices found"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* View modal */}
      {viewingInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-6"
          onClick={() => setViewingInvoice(null)}
        >
          <div
            className="relative my-6 max-w-full rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Invoice {invoiceNum(viewingInvoice)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(viewingInvoice)}
                  disabled={downloading === viewingInvoice.paymentId}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-50 dark:bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand transition-colors hover:bg-brand-100 dark:hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading === viewingInvoice.paymentId ? "Generating..." : "PDF"}
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 dark:text-slate-500 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[80vh] overflow-auto rounded-lg border border-gray-100 dark:border-slate-800">
              <InvoiceHtmlTemplate
                invoice={viewingInvoice}
                brand={brand}
                overrides={viewOverrides}
                templateId={viewTemplateId}
                pageFormat={viewPageFormat}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
