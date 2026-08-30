import { getTrackingSettingsAction } from "@/features/tracking-settings/actions";
import { getTrackingItemsAction } from "@/features/tracking-settings/registry-actions";
import { TrackingCoreTagsForm } from "@/features/tracking-settings/TrackingCoreTagsForm";
import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Analytics" };

export default async function TrackingSettingsPage() {
  const [itemsRes, settingsRes] = await Promise.all([
    getTrackingItemsAction(),
    getTrackingSettingsAction(),
  ]);

  const items = itemsRes.success ? itemsRes.data : [];
  const gscVerification = settingsRes.success ? settingsRes.data.gscVerification : null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm sm:h-11 sm:w-11">
            <ChartLineUp size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Analytics</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              Add your tracking IDs below. Scripts are automatically injected into every page of your website.
            </p>
          </div>
        </div>
      </div>

      <TrackingCoreTagsForm initialItems={items} initialGscVerification={gscVerification} />
    </div>
  );
}
