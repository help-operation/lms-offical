export const INVOICE_KEYS = [
  "invoice_company_name",
  "invoice_tagline",
  "invoice_logo_url",
  "invoice_address",
  "invoice_website",
  "invoice_phone",
  "invoice_email",
  "invoice_footer_tagline",
] as const;

export type InvoiceSettingsKey = (typeof INVOICE_KEYS)[number];

export type InvoiceSettings = Record<InvoiceSettingsKey, string>;

export const INVOICE_DEFAULTS: InvoiceSettings = {
  invoice_company_name:   "",
  invoice_tagline:        "",
  invoice_logo_url:       "",
  invoice_address:        "",
  invoice_website:        "",
  invoice_phone:          "",
  invoice_email:          "",
  invoice_footer_tagline: "",
};
