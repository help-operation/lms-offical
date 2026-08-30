import type { Invoice } from "@/features/invoices/api";

export function fmt(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined || amount === "") return "৳0.00";
  return `৳${Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function invoiceNum(inv: Invoice) {
  if (inv.displayInvoiceNumber) return inv.displayInvoiceNumber;
  if (inv.paystationInvoiceId) return inv.paystationInvoiceId;
  return `INV-${String(inv.paymentId).padStart(6, "0")}`;
}

export function methodLabel(inv: Invoice) {
  if (inv.method === "bkash")      return "bKash";
  if (inv.method === "paystation") return inv.paystationMethod ?? "PayStation";
  if (inv.method === "free")       return "Free / Coupon";
  return inv.method?.toUpperCase() ?? "—";
}

export interface InvoiceBrandSettings {
  companyName?: string;
  tagline?: string;
  logoUrl?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  footerTagline?: string;
}

export const BRAND_DEFAULTS: Required<InvoiceBrandSettings> = {
  companyName: "Skillkoro",
  tagline: "Online Learning Platform",
  logoUrl: "",
  address: "",
  website: "",
  phone: "",
  email: "",
  footerTagline: "",
};

// Page formats at 96dpi — fixed so the editor preview and the html2canvas capture match 1:1.
export type InvoicePageFormat = "a4" | "a5";

export const INVOICE_PAGE_SIZES: Record<InvoicePageFormat, { width: number; minHeight: number; label: string; pdfFormat: "a4" | "a5" }> = {
  a4: { width: 794, minHeight: 1123, label: "A4 (210 × 297 mm)", pdfFormat: "a4" },
  a5: { width: 559, minHeight: 794, label: "A5 (148 × 210 mm)", pdfFormat: "a5" },
};

/** @deprecated Use INVOICE_PAGE_SIZES[format] instead. */
export const INVOICE_PAGE_WIDTH = 794;
/** @deprecated Use INVOICE_PAGE_SIZES[format] instead. */
export const INVOICE_PAGE_MIN_HEIGHT = 1123;
