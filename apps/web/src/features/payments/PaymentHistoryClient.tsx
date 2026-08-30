"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, CheckCircle, XCircle, Clock, Receipt } from "lucide-react";
import { DataTable, type Column } from "@repo/ui/data-table";
import type { MyPayment } from "@/features/payments/api";
import { PaymentPDF, DEFAULT_INVOICE_BRAND, type InvoiceBrand } from "./PaymentPDF";

function fmt(v: string | null | undefined) {
  if (!v) return "৳0";
  return `৳${Number(v).toLocaleString("en-BD")}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function invoiceNum(p: MyPayment) {
  return p.displayInvoiceNumber ?? p.paystationInvoiceId ?? `INV-${String(p.paymentId).padStart(6, "0")}`;
}

function methodLabel(p: MyPayment) {
  if (p.method === "bkash")      return "bKash";
  if (p.method === "paystation") return p.paystationMethod ?? "PayStation";
  if (p.method === "free")       return "Free";
  return p.method?.toUpperCase() ?? "—";
}

function StatusBadge({ status }: { status: MyPayment["status"] }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30">
      <CheckCircle className="h-3 w-3" /> Paid
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30">
      <XCircle className="h-3 w-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

async function fetchInvoiceBrand(): Promise<InvoiceBrand> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${apiUrl}/system-settings/public?keys=invoice_company_name,invoice_tagline`,
    );
    if (!res.ok) return DEFAULT_INVOICE_BRAND;
    const json = await res.json();
    const data = (json?.data ?? json) as Record<string, string>;
    return {
      companyName: data.invoice_company_name || DEFAULT_INVOICE_BRAND.companyName,
      tagline:     data.invoice_tagline       || DEFAULT_INVOICE_BRAND.tagline,
    };
  } catch {
    return DEFAULT_INVOICE_BRAND;
  }
}

async function downloadPDF(payment: MyPayment) {
  const brand = await fetchInvoiceBrand();
  const blob = await pdf(<PaymentPDF payment={payment} brand={brand} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${invoiceNum(payment)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PaymentHistoryClient({ payments }: { payments: MyPayment[] }) {
  const [downloading, setDownloading] = useState<number | null>(null);

  async function handleDownload(p: MyPayment) {
    setDownloading(p.paymentId);
    try { await downloadPDF(p); }
    finally { setDownloading(null); }
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <Receipt className="h-7 w-7 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">No payments yet</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500">Your payment history will appear here after you purchase a course.</p>
      </div>
    );
  }

  const columns: Column<MyPayment>[] = [
    {
      key: "paystationInvoiceId",
      header: "Invoice #",
      render: (p) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{invoiceNum(p)}</span>
      ),
    },
    {
      key: "items",
      header: "Course(s)",
      render: (p) =>
        p.items.length === 0 ? (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        ) : (
          <div className="max-w-[200px]">
            {p.items.map((item) => (
              <div key={item.courseId} className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {item.courseTitle}
              </div>
            ))}
          </div>
        ),
    },
    {
      key: "method",
      header: "Method",
      render: (p) => (
        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {methodLabel(p)}
        </span>
      ),
    },
    {
      key: "finalAmount",
      header: "Amount",
      render: (p) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(p.finalAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (p) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">{fmtDate(p.paidAt ?? p.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <button
          onClick={() => handleDownload(p)}
          disabled={downloading === p.paymentId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap dark:text-sky-400 dark:hover:text-sky-300 dark:bg-sky-500/10 dark:hover:bg-sky-500/20"
        >
          <Download className="h-3.5 w-3.5" />
          {downloading === p.paymentId ? "Generating..." : "PDF"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Payments", value: String(payments.length), color: "text-slate-800 dark:text-slate-100" },
          { label: "Completed",      value: String(payments.filter(p => p.status === "completed").length), color: "text-green-600 dark:text-green-400" },
          { label: "Total Spent",    value: fmt(String(payments.filter(p=>p.status==="completed").reduce((s,p)=>s+parseFloat(p.finalAmount??'0'),0))), color: "text-sky-600 dark:text-sky-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-100 shadow-sm px-4 py-3 dark:bg-slate-900 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={payments}
        columns={columns}
        searchable
        searchKeys={["status", "method", "paystationInvoiceId", "displayInvoiceNumber"]}
        searchPlaceholder="Search payments…"
        emptyMessage="No payments found"
      />
    </div>
  );
}
