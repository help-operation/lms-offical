"use server";

import { apiRequest, ApiError } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";
import type { InvoicePageFormat } from "@/features/invoices/invoice-format";

export interface InvoiceDesignSettings {
  /** One override set per template design id, e.g. { classic: {...}, modern: {...} }. */
  overridesByTemplate: Record<string, StyleOverrides>;
  /** Which template design every invoice renders with, site-wide. */
  selectedTemplate: string;
  /** Page format: "a4" or "a5". */
  pageFormat: InvoicePageFormat;
}

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function parseOverridesMap(raw: string | undefined): Record<string, StyleOverrides> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export async function getInvoiceDesignSettingsAction() {
  try {
    const res = await apiRequest<Record<string, string>>("/system-settings");
    const s = res.data ?? {};
    return {
      success: true as const,
      data: {
        overridesByTemplate: parseOverridesMap(s.invoice_style_overrides),
        selectedTemplate: s.invoice_template || "classic",
        pageFormat: (s.invoice_page_format as InvoicePageFormat) || "a4",
      } satisfies InvoiceDesignSettings,
    };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}

/** Persists the full design state in one shot — overrides map + selected template + page format. */
export async function updateInvoiceDesignSettingsAction(settings: InvoiceDesignSettings) {
  try {
    await apiRequest<Record<string, string>>("/system-settings", {
      method: "PUT",
      body: JSON.stringify({
        invoice_style_overrides: JSON.stringify(settings.overridesByTemplate),
        invoice_template: settings.selectedTemplate,
        invoice_page_format: settings.pageFormat,
      }),
    });
    revalidatePath("/admin/invoice-settings");
    revalidatePath("/admin/invoices");
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: extractMessage(err) };
  }
}
