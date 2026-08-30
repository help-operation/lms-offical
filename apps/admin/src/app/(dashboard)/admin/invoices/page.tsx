import { getInvoicesAction } from "@/features/invoices/actions";
import { InvoicesClient } from "@/features/invoices/InvoicesClient";
import { getInvoiceSettingsAction } from "@/features/invoice-settings/actions";
import { getGeneralSettingsAction } from "@/features/general-settings/actions";
import { getInvoiceDesignSettingsAction } from "@/features/invoice-settings/style-overrides-actions";
import { FileText } from "lucide-react";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const [invoicesRes, settingsRes, designRes, generalRes] = await Promise.all([
    getInvoicesAction({ page: 1, per_page: 20 }),
    getInvoiceSettingsAction(),
    getInvoiceDesignSettingsAction(),
    getGeneralSettingsAction(),
  ]);

  const initial = invoicesRes.success
    ? invoicesRes.data
    : {
        data: [],
        pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 },
        stats: { total: 0, paid: 0, pending: 0, revenue: 0 },
      };

  const s = settingsRes.success ? settingsRes.data : {};
  const g = generalRes.success ? generalRes.data : {};
  const brand = {
    companyName: g.general_site_name,
    tagline: g.general_tagline,
    logoUrl: g.general_logo_url,
    address: g.general_address,
    website: s.invoice_website,
    phone: s.invoice_phone,
    email: s.invoice_email,
    footerTagline: s.invoice_footer_tagline,
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand/15">
          <FileText className="h-5 w-5 text-brand-600 dark:text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">All payment records — download PDF invoices</p>
        </div>
      </div>

      <InvoicesClient
        initial={initial}
        brand={brand}
        design={designRes.success ? designRes.data : { overridesByTemplate: {}, selectedTemplate: "classic", pageFormat: "a4" as const }}
      />
    </div>
  );
}
