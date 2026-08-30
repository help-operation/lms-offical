import { getSocialSettingsAction } from "@/features/social-settings/actions";
import { SocialSettingsForm } from "@/features/social-settings/SocialSettingsForm";
import { ShareNetwork } from "@phosphor-icons/react/dist/ssr";

export default async function SocialLinksPage() {
  const res = await getSocialSettingsAction();
  const initial = res.success ? res.data : {};

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm sm:h-11 sm:w-11">
            <ShareNetwork size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">Social Links</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              Your social media URLs shown in the footer and contact page.
            </p>
          </div>
        </div>
      </div>

      <SocialSettingsForm initial={initial} />
    </div>
  );
}
