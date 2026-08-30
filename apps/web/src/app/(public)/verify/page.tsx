import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { VerifyForm } from "@/features/verify/VerifyForm";
import { getPublicSiteSettings } from "@/features/cms/api/settings";
import { deriveCertPrefix } from "@/shared/utils/cert-prefix";

export const metadata: Metadata = {
  title: "Verify a Certificate",
  description:
    "Confirm the authenticity of a certificate by entering its unique certificate ID.",
};

export default async function VerifyPage() {
  const siteSettings = await getPublicSiteSettings();
  const siteName = siteSettings.site_name || "Skillkoro";
  const certPrefix = deriveCertPrefix(siteName);

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-brand-50 via-white to-indigo-50 px-4 py-16 transition-colors duration-300 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/15">
            <ShieldCheck className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify a Certificate
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Enter the certificate ID found on a {siteName} certificate to confirm it is
            authentic and see its details.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Certificate ID
          </label>
          <VerifyForm certPrefix={certPrefix} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          The certificate ID is printed on every {siteName} certificate and starts with{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">{certPrefix}-</code>.
        </p>
      </div>
    </div>
  );
}
