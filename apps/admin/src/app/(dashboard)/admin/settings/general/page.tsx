import { getGeneralSettingsAction } from "@/features/general-settings/actions";
import { GeneralSettingsForm } from "@/features/general-settings/GeneralSettingsForm";
import { PurgeCacheCard } from "@/features/cache/PurgeCacheCard";
import { Globe } from "@phosphor-icons/react/dist/ssr";

export default async function GeneralSettingsPage() {
  const res = await getGeneralSettingsAction();
  const initial = res.success ? res.data : {};

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm sm:h-11 sm:w-11">
            <Globe size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">General Settings</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              Site name, logo, contact details and address shown across your website.
            </p>
          </div>
        </div>
      </div>

      <GeneralSettingsForm initial={initial} />

      <PurgeCacheCard />
    </div>
  );
}
