"use client";

import type { InvoiceBrandSettings } from "@/features/invoices/InvoiceHtmlTemplate";
import { InvoiceDesignEditor } from "./InvoiceDesignEditor";
import type { InvoiceDesignSettings } from "./style-overrides-actions";

interface Props {
  settingsInitial: Record<string, string>;
  designInitial: InvoiceDesignSettings;
  brand: InvoiceBrandSettings;
}

export function InvoiceSettingsTabs({ settingsInitial, designInitial, brand }: Props) {
  return (
    <div>
      <InvoiceDesignEditor initial={designInitial} brand={brand} />
    </div>
  );
}
