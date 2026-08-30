import { menusAdminApi } from "@/features/menus/api";
import { MenusManager } from "@/features/menus/MenusManager";
import type { MenusGrouped } from "@/features/menus/types";
import { List } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Menus" };

const EMPTY: MenusGrouped = {
  navbar: [],
  navbar_more: [],
  footer_company: [],
  footer_others: [],
};

export default async function MenusPage() {
  const res = await menusAdminApi.getAll().catch(() => null);
  const initial: MenusGrouped = res?.data ?? EMPTY;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm sm:h-11 sm:w-11">
            <List size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Menus</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              Manage the links shown in the website header and footer.
            </p>
          </div>
        </div>
      </div>

      <MenusManager initial={initial} />
    </div>
  );
}
