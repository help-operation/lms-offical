"use client";

import type { Invoice } from "@/features/invoices/api";
import { TemplateStyleScope, type StyleOverrides } from "@repo/ui/template-style-overrides";
import {
  fmt, fmtDate, invoiceNum,
  BRAND_DEFAULTS, INVOICE_PAGE_SIZES,
  type InvoiceBrandSettings, type InvoicePageFormat,
} from "../invoice-format";

const EMERALD = "#059669";
const EMERALD_DARK = "#065f46";
const EMERALD_TINT = "#ecfdf5";

interface Props {
  invoice: Invoice;
  brand?: InvoiceBrandSettings;
  overrides?: StyleOverrides;
  pageFormat?: InvoicePageFormat;
}

/**
 * "Emerald Modern" design — rounded cards, emerald color block header, softer
 * SaaS-style layout. Every direct child of the TemplateStyleScope root is one
 * clickable/stylable "section" — keep new sections as flat direct children,
 * not nested wrappers, so the editor's :nth-child selector stays meaningful.
 */
export function InvoiceTemplateModern({ invoice, brand, overrides, pageFormat = "a4" }: Props) {
  const b = { ...BRAND_DEFAULTS, ...brand };
  const pageSize = INVOICE_PAGE_SIZES[pageFormat];
  const status = invoice.status;
  const statusLabel = status === "completed" ? "PAID" : status === "failed" ? "FAILED" : "PENDING";
  const statusColors =
    status === "completed"
      ? { bg: "#dcfce7", color: "#16a34a" }
      : status === "failed"
        ? { bg: "#fee2e2", color: "#dc2626" }
        : { bg: "#fef3c7", color: "#d97706" };

  const subtotal = parseFloat(invoice.totalAmount ?? "0");
  const discount = parseFloat(invoice.discountAmount ?? "0");

  return (
    <TemplateStyleScope
      overrides={overrides}
      className="relative flex flex-col bg-white pb-10"
      style={{
        width: pageSize.width,
        minHeight: pageSize.minHeight,
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: 10,
        color: "#1f2937",
      }}
    >
      {/* Header band */}
      <div className="flex items-center justify-between rounded-b-3xl px-10 py-7" style={{ backgroundColor: EMERALD }}>
        <div className="flex items-center gap-2.5">
          {!!b.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" className="h-10 w-10 rounded-full bg-white object-contain p-1" />
          )}
          <div>
            <p className="text-xl font-bold text-white">{b.companyName}</p>
            {!!b.tagline && <p className="text-[8px] text-emerald-100">{b.tagline}</p>}
          </div>
        </div>
        <div className="text-right">
          {!!b.website && <p className="text-[9px] text-emerald-50">{b.website}</p>}
          {!!b.phone && <p className="text-[9px] text-emerald-50">{b.phone}</p>}
          {!!b.email && <p className="text-[9px] text-emerald-50">{b.email}</p>}
          {!!b.address && <p className="text-[9px] text-emerald-50">{b.address}</p>}
        </div>
      </div>

      {/* Heading + Invoice No/Date card */}
      <div className="flex items-start justify-between px-10 pt-7">
        <p className="text-3xl font-bold" style={{ color: EMERALD_DARK }}>Invoice</p>
        <div className="w-[230px] rounded-2xl p-4" style={{ backgroundColor: EMERALD_TINT }}>
          <div className="flex justify-between py-0.5">
            <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-700">Invoice No.</p>
            <p className="text-[9px] text-gray-700">{invoiceNum(invoice)}</p>
          </div>
          <div className="flex justify-between py-0.5">
            <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-700">Date</p>
            <p className="text-[9px] text-gray-700">{fmtDate(invoice.paidAt ?? invoice.createdAt)}</p>
          </div>
          {status !== "completed" && (
            <p
              className="mt-1.5 inline-block rounded-full px-2 py-[3px] text-[8px] font-bold uppercase"
              style={{ backgroundColor: statusColors.bg, color: statusColors.color }}
            >
              {statusLabel}
            </p>
          )}
        </div>
      </div>

      {/* Bill To card */}
      <div className="mx-10 mt-6 rounded-2xl border-l-4 p-4" style={{ backgroundColor: EMERALD_TINT, borderColor: EMERALD }}>
        <p className="text-[8px] font-bold uppercase tracking-wide" style={{ color: EMERALD_DARK }}>Bill To</p>
        <p className="mt-1.5 text-[11px] font-bold text-gray-900">
          {invoice.firstName}{invoice.lastName ? ` ${invoice.lastName}` : ""}
        </p>
        <p className="mt-0.5 text-[9px] text-gray-600">{invoice.email}</p>
        {!!invoice.phone && <p className="mt-0.5 text-[9px] text-gray-600">{invoice.phone}</p>}
      </div>

      {/* Items table */}
      <div className="mx-10 mt-6 overflow-hidden rounded-2xl border border-gray-100">
        <div className="flex px-3 py-2.5" style={{ backgroundColor: EMERALD }}>
          <p className="w-[28px] text-[8px] font-bold uppercase tracking-wide text-white">SL</p>
          <p className="flex-1 text-[8px] font-bold uppercase tracking-wide text-white">Description</p>
          <p className="w-[34px] text-center text-[8px] font-bold uppercase tracking-wide text-white">Qty</p>
          <p className="w-[70px] text-right text-[8px] font-bold uppercase tracking-wide text-white">Unit Price</p>
          <p className="w-[70px] text-right text-[8px] font-bold uppercase tracking-wide text-white">Amount</p>
        </div>
        {invoice.items.map((item, i) => (
          <div
            key={item.courseId}
            className="flex px-3 py-2.5"
            style={i % 2 === 1 ? { backgroundColor: EMERALD_TINT } : undefined}
          >
            <p className="w-[28px] text-[9px] text-gray-700">{String(i + 1).padStart(2, "0")}</p>
            <p className="flex-1 text-[9px] text-gray-700">{item.courseTitle}</p>
            <p className="w-[34px] text-center text-[9px] text-gray-700">{item.quantity ?? 1}</p>
            <p className="w-[70px] text-right text-[9px] text-gray-700">{fmt(item.price)}</p>
            <p className="w-[70px] text-right text-[9px] text-gray-700">{fmt(Number(item.price) * (item.quantity ?? 1))}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="ml-auto mr-10 mt-6 w-[230px] overflow-hidden rounded-2xl border border-gray-100">
        <div className="flex justify-between px-3 py-1.5">
          <p className="text-[9px] text-gray-500">Subtotal</p>
          <p className="text-[9px] text-gray-700">{fmt(subtotal)}</p>
        </div>
        {discount > 0 && (
          <div className="flex justify-between px-3 py-1.5">
            <p className="text-[9px] text-gray-500">Discount</p>
            <p className="text-[9px]" style={{ color: "#16a34a" }}>
              -{fmt(discount)}
            </p>
          </div>
        )}
        <div className="flex justify-between px-3 py-2.5" style={{ backgroundColor: EMERALD }}>
          <p className="text-[10px] font-bold text-white">Total Due</p>
          <p className="text-[10px] font-bold text-white">{fmt(invoice.finalAmount)}</p>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-7 flex flex-col items-end px-10">
        <div className="w-[180px] border-t border-gray-300" />
        <p className="mt-1.5 text-[9px] font-bold text-gray-900">Authorized Signature</p>
        <p className="mt-0.5 text-[8px] text-gray-500">{b.companyName}</p>
      </div>

      {/* Footer banner */}
      <div className="mx-10 mt-7 rounded-full py-2.5 text-center" style={{ backgroundColor: EMERALD_DARK }}>
        {!!b.footerTagline && <p className="text-[9px] font-bold text-white">{b.footerTagline}</p>}
      </div>
    </TemplateStyleScope>
  );
}
