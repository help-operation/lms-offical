"use client";

import type { Invoice } from "@/features/invoices/api";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";
import { getInvoiceTemplate, DEFAULT_INVOICE_TEMPLATE_ID } from "./templates/registry";
import type { InvoiceBrandSettings, InvoicePageFormat } from "./invoice-format";

export type { InvoiceBrandSettings, InvoicePageFormat } from "./invoice-format";
export { INVOICE_PAGE_WIDTH, INVOICE_PAGE_MIN_HEIGHT, INVOICE_PAGE_SIZES } from "./invoice-format";
export { INVOICE_TEMPLATES, DEFAULT_INVOICE_TEMPLATE_ID, getInvoiceTemplate } from "./templates/registry";

interface Props {
  invoice: Invoice;
  brand?: InvoiceBrandSettings;
  overrides?: StyleOverrides;
  templateId?: string;
  pageFormat?: InvoicePageFormat;
}

/**
 * Dispatches to the chosen invoice template design (see ./templates/registry.ts).
 * Being real DOM (not @react-pdf/renderer) lets each template be (a) captured by
 * html2canvas for PDF export and (b) driven by <InlineStyleEditor> for live,
 * click-to-style editing (see the Design tab on /admin/invoice-settings).
 */
export function InvoiceHtmlTemplate({ invoice, brand, overrides, templateId = DEFAULT_INVOICE_TEMPLATE_ID, pageFormat = "a4" }: Props) {
  const template = getInvoiceTemplate(templateId);
  const Component = template.component;
  return <Component invoice={invoice} brand={brand} overrides={overrides} pageFormat={pageFormat} />;
}
