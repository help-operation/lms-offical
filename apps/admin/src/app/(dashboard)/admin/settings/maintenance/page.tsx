import { Wrench } from "lucide-react";
import { getMaintenanceSettingsAction } from "@/features/maintenance/actions";
import { MaintenanceSettingsClient } from "@/features/maintenance/MaintenanceSettingsClient";

export const metadata = { title: "Maintenance Mode" };

export default async function MaintenanceSettingsPage() {
  const res = await getMaintenanceSettingsAction();
  const data = res.success ? res.data : {};

  const initialEnabled = data.maintenance_enabled === "true";
  const initialMessage =
    data.maintenance_message?.trim() ||
    "We are currently performing scheduled maintenance. We'll be back shortly.";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm sm:h-11 sm:w-11">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Maintenance Mode</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
                Take the student site offline for maintenance without affecting the admin panel.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              initialEnabled
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${initialEnabled ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
            {initialEnabled ? "Under maintenance" : "Site is live"}
          </span>
        </div>
      </div>

      <MaintenanceSettingsClient
        initialEnabled={initialEnabled}
        initialMessage={initialMessage}
      />
    </div>
  );
}
