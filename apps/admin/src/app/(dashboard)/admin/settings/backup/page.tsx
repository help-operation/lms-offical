import { getBackupHistoryAction, getBackupTablesAction, getBackupCategoriesAction } from "@/features/backup/actions";
import { BackupClient } from "@/features/backup/BackupClient";
import { Database } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Backup & Restore" };

export default async function BackupSettingsPage() {
  const [historyRes, tablesRes, categoriesRes] = await Promise.all([
    getBackupHistoryAction(),
    getBackupTablesAction(),
    getBackupCategoriesAction(),
  ]);

  const backups = historyRes.success ? historyRes.data : { data: [], total: 0 };
  const tables = tablesRes.success ? tablesRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm sm:h-11 sm:w-11">
            <Database size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Backup & Restore</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              Export your database by category, full dump, or selective tables. Import previous backups with conflict resolution.
            </p>
          </div>
        </div>
      </div>

      <BackupClient
        initialBackups={backups.data}
        initialTotal={backups.total}
        initialTables={tables}
        initialCategories={categories}
      />
    </div>
  );
}
