import { InvoiceTemplateClassic } from "./InvoiceTemplateClassic";
import { InvoiceTemplateModern } from "./InvoiceTemplateModern";
import { InvoiceTemplatePurple } from "./InvoiceTemplatePurple";
import type { Invoice } from "@/features/invoices/api";
import type { InvoiceBrandSettings, InvoicePageFormat } from "../invoice-format";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";

export interface InvoiceTemplateProps {
  invoice: Invoice;
  brand?: InvoiceBrandSettings;
  overrides?: StyleOverrides;
  pageFormat?: InvoicePageFormat;
}

export interface InvoiceTemplateDefinition {
  id: string;
  name: string;
  description: string;
  previewColors: string[];
  component: (props: InvoiceTemplateProps) => React.JSX.Element;
}

export const INVOICE_TEMPLATES: InvoiceTemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Navy/blue diagonal banner, icon-badged contact block. Bold and brand-forward.",
    previewColors: ["#0b1f3a", "#1d4ed8"],
    component: InvoiceTemplateClassic,
  },
  {
    id: "modern",
    name: "Emerald Modern",
    description: "Rounded cards, emerald color block header. Softer, modern SaaS-style layout.",
    previewColors: ["#059669", "#065f46"],
    component: InvoiceTemplateModern,
  },
  {
    id: "purple",
    name: "Purple Elegant",
    description: "Purple theme with yellow accent, clean card-based layout.",
    previewColors: ["#9333ea", "#eab308"],
    component: InvoiceTemplatePurple,
  },
];

export const DEFAULT_INVOICE_TEMPLATE_ID = INVOICE_TEMPLATES[0]!.id;

export function getInvoiceTemplate(id: string | undefined): InvoiceTemplateDefinition {
  return INVOICE_TEMPLATES.find((t) => t.id === id) ?? INVOICE_TEMPLATES[0]!;
}
