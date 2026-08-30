import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";
import { getPublicSiteSettings } from "@/features/cms/api/settings";
import { deriveCertPrefix } from "@/shared/utils/cert-prefix";

export default async function CertificateNotFound() {
  const siteSettings = await getPublicSiteSettings();
  const certPrefix = deriveCertPrefix(siteSettings.site_name || "Skillkoro");

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-50 px-4 py-16 transition-colors duration-300 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
          <ShieldX className="h-7 w-7 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Certificate not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          We couldn&apos;t verify a certificate with that ID. Double-check the code — it
          should look like <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">{certPrefix}-…</code> — and try again.
        </p>
        <Link
          href="/verify"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Try another ID
        </Link>
      </div>
    </div>
  );
}
