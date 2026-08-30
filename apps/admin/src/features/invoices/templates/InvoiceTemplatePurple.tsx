"use client";

import type { Invoice } from "@/features/invoices/api";
import { TemplateStyleScope, type StyleOverrides } from "@repo/ui/template-style-overrides";
import {
  fmt, fmtDate, invoiceNum, methodLabel,
  BRAND_DEFAULTS, INVOICE_PAGE_SIZES,
  type InvoiceBrandSettings, type InvoicePageFormat,
} from "../invoice-format";

const PURPLE = "#9333ea";
const PURPLE_LIGHT = "#f3e8ff";
const YELLOW = "#eab308";

interface Props {
  invoice: Invoice;
  brand?: InvoiceBrandSettings;
  overrides?: StyleOverrides;
  pageFormat?: InvoicePageFormat;
}

/**
 * "Purple Elegant" design based on user provided image.
 */
export function InvoiceTemplatePurple({ invoice, brand, overrides, pageFormat = "a4" }: Props) {
  const b = { ...BRAND_DEFAULTS, ...brand };
  const pageSize = INVOICE_PAGE_SIZES[pageFormat];
  const status = invoice.status;
  const statusLabel = status === "completed" ? "Paid" : status === "failed" ? "Failed" : "Pending";
  const statusColors =
    status === "completed"
      ? { bg: "#dcfce7", color: "#16a34a" }
      : status === "failed"
        ? { bg: "#fee2e2", color: "#dc2626" }
        : { bg: "#fef3c7", color: "#d97706" };

  return (
    <TemplateStyleScope
      overrides={overrides}
      className="relative flex flex-col bg-white p-10"
      style={{
        width: pageSize.width,
        minHeight: pageSize.minHeight,
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: 10,
        color: "#1f2937",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center">
            {!!b.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logoUrl} alt="" className="h-16 object-contain" />
            )}
        </div>
        <p className="text-4xl font-light text-gray-300 tracking-widest uppercase">Invoice</p>
      </div>
      <div className="h-1 w-full mb-8 bg-gradient-to-r from-purple-600 via-purple-600 to-yellow-500 rounded-full" />

      {/* Student Information Card */}
      <div className="rounded-xl overflow-hidden mb-8" style={{ backgroundColor: "#f8f3ff" }}>
        <div className="px-6 py-3" style={{ backgroundColor: "#e2c9ff" }}>
          <p className="font-bold" style={{ color: PURPLE }}>STUDENT INFORMATION</p>
        </div>
        <div className="p-6 grid grid-cols-3 gap-6">
            <div>
                <p className="font-bold text-[8px] uppercase tracking-wider" style={{ color: PURPLE }}>Transaction ID</p>
                <p className="text-[10px] mt-1 text-gray-700 font-medium">{invoice.paystationTrxId ?? invoice.bkashTrxId ?? "N/A"}</p>
                <p className="font-bold text-[8px] uppercase tracking-wider mt-4" style={{ color: PURPLE }}>Date of Payment</p>
                <p className="text-[10px] mt-1 text-gray-700 font-medium">{fmtDate(invoice.paidAt ?? invoice.createdAt)}</p>
                <p className="font-bold text-[8px] uppercase tracking-wider mt-4" style={{ color: PURPLE }}>M.BANKING/CARDS/ACCOUNT</p>
                <p className="text-[10px] mt-1 text-gray-700 font-medium">01XXXXXX219</p>
                <p className="font-bold text-[8px] uppercase tracking-wider mt-4" style={{ color: PURPLE }}>PAYMENT STATUS</p>
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>{statusLabel}</span>
            </div>
            <div>
                <p className="font-bold text-[8px] uppercase tracking-wider" style={{ color: PURPLE }}>Merchant Name</p>
                <p className="text-[10px] mt-1 text-gray-700 font-medium">{b.companyName}</p>
                <p className="font-bold text-[8px] uppercase tracking-wider mt-4" style={{ color: PURPLE }}>Payment Currency</p>
                <p className="text-[10px] mt-1 text-gray-700 font-medium">BDT</p>
                <p className="font-bold text-[8px] uppercase tracking-wider mt-4" style={{ color: PURPLE }}>Payment Type</p>
                <p className="text-[10px] mt-1 text-gray-700 font-medium">{methodLabel(invoice)}</p>
            </div>
            <div>
                <p className="font-bold text-[8px] uppercase tracking-wider" style={{ color: PURPLE }}>Billed To</p>
                <p className="text-[11px] mt-1 font-bold text-gray-900">{invoice.firstName} {invoice.lastName}</p>
                <p className="text-[10px] text-gray-700 mt-1">Jashore</p>
                <p className="text-[10px] text-gray-700">DHAKA, BANGLADESH</p>
                <p className="text-[10px] text-gray-700 mt-2">Phone: {invoice.phone}</p>
                <p className="text-[10px] text-gray-700 mt-0">Email: {invoice.email}</p>
            </div>
        </div>
      </div>

      {/* Description Table */}
      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
        <div className="px-6 py-3 text-white" style={{ backgroundColor: PURPLE }}>
            <p className="font-bold uppercase">DESCRIPTION</p>
        </div>
        <div className="p-6">
            {invoice.items.map((item) => (
                <div key={item.courseId} className="flex justify-between items-start mb-2">
                    <div>
                        <p className="font-bold text-[14px] text-gray-900">{item.courseTitle}</p>
                        <p className="text-[12px] text-gray-500">{b.tagline}</p>
                    </div>
                    <div className="text-right text-[12px] text-gray-700 space-y-1">
                        <div className="flex justify-between gap-8"><p>Price:</p><p className="font-bold text-gray-900">{fmt(item.price)}</p></div>
                    </div>
                </div>
            ))}
            <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-[18px] font-bold" style={{ color: PURPLE }}>
                    <p>Total:</p>
                    <p>BDT {fmt(invoice.finalAmount)}</p>
                </div>
                <div className="flex justify-between items-center text-[14px] font-bold text-gray-900 mt-1">
                    <p>Due Amount:</p>
                    <p>0.00</p>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="mt-4 rounded-xl p-6 grid grid-cols-2 items-center" style={{ backgroundColor: YELLOW }}>
        <p className="font-bold text-[12px] text-gray-900">স্কিলকোরো, দক্ষ হও, দুনিয়া বদলাও</p>
        <div className="text-right text-[12px] font-bold text-gray-900">
            <p>{b.website || "skillkoro.com"}</p>
            <p>{b.email || "support@skillkoro.com"}</p>
        </div>
      </div>

      {/* Help & Secure Payment */}
      <div className="mt-3 border border-gray-200 rounded-xl text-center text-[11px] text-gray-600" style={{ backgroundColor: "#fbf9ff" }}>
        <div className="p-2 border-b border-gray-200">
          Need help? Contact <span className="font-bold" style={{color: PURPLE}}>{b.email || "support@skillkoro.com"}</span>
        </div>
        <div className="p-2 flex items-center justify-center gap-2">
          Secure Payment Processing By: <span className="font-bold" style={{color: PURPLE}}>PayStation</span>
        </div>
      </div>
    </TemplateStyleScope>
  );
}
