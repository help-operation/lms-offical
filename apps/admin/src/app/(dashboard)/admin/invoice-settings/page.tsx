import { getInvoiceSettingsAction } from "@/features/invoice-settings/actions";
import { getGeneralSettingsAction } from "@/features/general-settings/actions";
import { getInvoiceDesignSettingsAction } from "@/features/invoice-settings/style-overrides-actions";
import { InvoiceSettingsTabs } from "@/features/invoice-settings/InvoiceSettingsTabs";
import { Receipt } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Invoice Settings" };

export default async function InvoiceSettingsPage() {
  const [settingsRes, designRes, generalRes] = await Promise.all([
    getInvoiceSettingsAction(),
    getInvoiceDesignSettingsAction(),
    getGeneralSettingsAction(),
  ]);

  const settingsInitial = settingsRes.success ? settingsRes.data : {};
  const generalInitial = generalRes.success ? generalRes.data : {};

  const brand = {
    companyName: generalInitial.general_site_name,
    tagline: generalInitial.general_tagline,
    logoUrl: generalInitial.general_logo_url,
    address: generalInitial.general_address,
    website: settingsInitial.invoice_website,
    phone: settingsInitial.invoice_phone,
    email: settingsInitial.invoice_email,
    footerTagline: settingsInitial.invoice_footer_tagline,
  };

  const designInitial = designRes.success
    ? designRes.data
    : { overridesByTemplate: {}, selectedTemplate: "classic", pageFormat: "a4" as const };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Receipt size={18} weight="fill" className="text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Settings</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
          Configure the company information and customize the invoice template used across your system.
        </p>
      </div>

      <InvoiceSettingsTabs settingsInitial={settingsInitial} designInitial={designInitial} brand={brand} />
    </div>
  );
}
