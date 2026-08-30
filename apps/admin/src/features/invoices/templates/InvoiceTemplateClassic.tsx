"use client";

import type { ReactNode } from "react";
import { Globe, Phone, Envelope, MapPin, User } from "@phosphor-icons/react";
import type { Invoice } from "@/features/invoices/api";
import { TemplateStyleScope, type StyleOverrides } from "@repo/ui/template-style-overrides";
import {
  fmt, fmtDate, invoiceNum,
  BRAND_DEFAULTS, INVOICE_PAGE_SIZES,
  type InvoiceBrandSettings, type InvoicePageFormat,
} from "../invoice-format";

const NAVY = "#0b1f3a";
const BLUE = "#1d4ed8";

/** Small circular icon badge used in the contact block and Bill To label. */
function IconBadge({ icon: Icon, size = 24 }: { icon: React.ElementType; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: BLUE }}
    >
      <Icon size={Math.round(size * 0.55)} weight="bold" color="#ffffff" />
    </span>
  );
}

function ContactRow({ icon, children }: { icon: React.ElementType; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <IconBadge icon={icon} />
      <div className="text-left">{children}</div>
    </div>
  );
}

interface Props {
  invoice: Invoice;
  brand?: InvoiceBrandSettings;
  overrides?: StyleOverrides;
  pageFormat?: InvoicePageFormat;
}

/**
 * "Classic" design — navy/blue diagonal banner, icon-badged contact block.
 * Every direct child of the TemplateStyleScope root is one clickable/stylable
 * "section" — keep new sections as flat direct children, not nested wrappers,
 * so the editor's :nth-child selector path stays meaningful.
 */
export function InvoiceTemplateClassic({ invoice, brand, overrides, pageFormat = "a4" }: Props) {
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
      className="relative flex flex-col bg-white text-[#1f2937]"
      style={{
        width: pageSize.width,
        minHeight: pageSize.minHeight,
        fontFamily: "Helvetica, Arial, sans-serif",
        fontSize: 10,
      }}
    >
      {/* Top decorative banner — diagonal blue→navy cut */}
      <div className="relative overflow-hidden" style={{ height: 44, backgroundColor: BLUE }}>
        <div
          style={{
            position: "absolute",
            top: -130,
            right: -60,
            width: 320,
            height: 300,
            backgroundColor: NAVY,
            transform: "rotate(20deg)",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-10 pt-8">
        <div className="flex items-center gap-2.5">
          {!!b.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" className="h-10 w-10 object-contain" />
          )}
          <div>
            <p className="text-xl font-bold" style={{ color: NAVY }}>{b.companyName}</p>
            {!!b.tagline && <p className="text-[8px] text-gray-500">{b.tagline}</p>}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2">
          {!!b.website && <ContactRow icon={Globe}><p className="text-[9px] text-gray-700">{b.website}</p></ContactRow>}
          {!!b.phone && <ContactRow icon={Phone}><p className="text-[9px] text-gray-700">{b.phone}</p></ContactRow>}
          {!!b.email && <ContactRow icon={Envelope}><p className="text-[9px] text-gray-700">{b.email}</p></ContactRow>}
          {!!b.address && <ContactRow icon={MapPin}><p className="text-[9px] text-gray-700">{b.address}</p></ContactRow>}
        </div>
      </div>

      {/* Heading */}
      <p className="mt-4 px-10 text-3xl font-bold" style={{ color: NAVY }}>INVOICE</p>
      <div className="ml-10 mt-1 h-[3px] w-[60px]" style={{ backgroundColor: BLUE }} />

      {/* Status chip */}
      {status !== "completed" && (
        <p
          className="ml-auto mr-10 mt-3 rounded px-2 py-[3px] text-[8px] font-bold uppercase"
          style={{ backgroundColor: statusColors.bg, color: statusColors.color }}
        >
          {statusLabel}
        </p>
      )}

      {/* Invoice No. / Date box */}
      <div className="ml-auto mr-10 mt-4 w-[220px] border border-gray-200">
        <div className="flex">
          <div className="w-[100px] px-2 py-1.5" style={{ backgroundColor: NAVY }}>
            <p className="text-[8px] font-bold text-white">Invoice No.</p>
          </div>
          <div className="flex flex-1 items-center px-2 py-1.5">
            <p className="text-[9px] text-gray-700">{invoiceNum(invoice)}</p>
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <div className="w-[100px] px-2 py-1.5" style={{ backgroundColor: NAVY }}>
            <p className="text-[8px] font-bold text-white">Invoice Date</p>
          </div>
          <div className="flex flex-1 items-center px-2 py-1.5">
            <p className="text-[9px] text-gray-700">{fmtDate(invoice.paidAt ?? invoice.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="px-10 pt-6">
        <div className="flex items-center gap-2">
          <IconBadge icon={User} size={22} />
          <p
            className="rounded px-3 py-1 text-[8px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: NAVY }}
          >
            Bill To
          </p>
        </div>
        <p className="mt-2 text-[11px] font-bold text-gray-900">
          {invoice.firstName}{invoice.lastName ? ` ${invoice.lastName}` : ""}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-700">{invoice.email}</p>
        {!!invoice.phone && <p className="mt-0.5 text-[10px] text-gray-700">Phone: {invoice.phone}</p>}
      </div>

      {/* Items table */}
      <div className="px-10 pt-5">
        <div className="flex px-2.5 py-2" style={{ backgroundColor: NAVY }}>
          <p className="w-[28px] text-[8px] font-bold uppercase tracking-wide text-white">SL</p>
          <p className="flex-1 text-[8px] font-bold uppercase tracking-wide text-white">Description</p>
          <p className="w-[34px] text-center text-[8px] font-bold uppercase tracking-wide text-white">Qty</p>
          <p className="w-[70px] text-right text-[8px] font-bold uppercase tracking-wide text-white">Unit Price</p>
          <p className="w-[70px] text-right text-[8px] font-bold uppercase tracking-wide text-white">Amount</p>
        </div>
        {invoice.items.map((item, i) => (
          <div
            key={item.courseId}
            className="flex border-b border-gray-100 px-2.5 py-2.5"
            style={i % 2 === 1 ? { backgroundColor: "#f9fafb" } : undefined}
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
      <div className="ml-auto mr-10 mt-5 w-[220px] border border-gray-200">
        <div className="flex justify-between border-b border-gray-200 px-2.5 py-1.5">
          <p className="text-[9px] text-gray-500">Subtotal</p>
          <p className="text-[9px] text-gray-700">{fmt(subtotal)}</p>
        </div>
        {discount > 0 && (
          <div className="flex justify-between border-b border-gray-200 px-2.5 py-1.5">
            <p className="text-[9px] text-gray-500">Discount</p>
            <p className="text-[9px]" style={{ color: "#16a34a" }}>
              -{fmt(discount)}
            </p>
          </div>
        )}
        <div className="flex justify-between px-2.5 py-2" style={{ backgroundColor: NAVY }}>
          <p className="text-[10px] font-bold text-white">Total Due</p>
          <p className="text-[10px] font-bold text-white">{fmt(invoice.finalAmount)}</p>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-6 flex flex-col items-end px-10">
        <div className="w-[180px] border-t border-gray-400" />
        <p className="mt-1.5 text-[9px] font-bold text-gray-900">Authorized Signature</p>
        <p className="mt-0.5 text-[8px] text-gray-500">{b.companyName}</p>
      </div>

      {/* Bottom tagline banner */}
      <div className="mt-auto flex items-center justify-center py-2.5" style={{ backgroundColor: NAVY }}>
        {!!b.footerTagline && <p className="text-[9px] font-bold text-white">{b.footerTagline}</p>}
      </div>
    </TemplateStyleScope>
  );
}
