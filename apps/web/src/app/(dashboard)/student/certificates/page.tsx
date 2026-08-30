import Link from "next/link";
import { Award, BadgeCheck, Download, ArrowUpRight } from "lucide-react";
import { certificatesApi } from "@/features/courses/api/certificates";
import { getPublicSiteSettings } from "@/features/cms/api/settings";

export const metadata = { title: "My Certificates" };

export default async function StudentCertificatesPage() {
  const [res, siteSettings] = await Promise.all([
    certificatesApi.mine().catch(() => null),
    getPublicSiteSettings(),
  ]);
  const certificates = res?.data ?? [];
  const siteName = siteSettings.site_name || "Skillkoro";

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
      </p>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 mb-3">
            <Award className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            No certificates yet
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-5">
            Complete a course to earn your first certificate
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 bg-brand-solid hover:bg-brand-hover text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {certificates.map((cert) => {
            const issuedDate = cert.issuedAt
              ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—";

            return (
              <div
                key={cert.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Certificate preview */}
                <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-indigo-600 px-6 py-7 text-center text-white">
                  {/* Decorative glow */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                  <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10" />

                  {/* Certified ribbon */}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm">
                    <BadgeCheck className="h-3 w-3" />
                    Certified
                  </span>

                  {/* Seal */}
                  <div className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    <Award className="h-6 w-6" />
                  </div>

                  <p className="relative text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-100">
                    Certificate of Completion
                  </p>
                  <p className="relative mt-2 line-clamp-2 min-h-[2.75rem] text-lg font-bold leading-snug">
                    {cert.courseTitle}
                  </p>
                  <p className="relative mt-3 font-serif text-sm italic text-brand-100">
                    {siteName}
                  </p>
                </div>

                {/* Meta + actions */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Issued {issuedDate}
                    </span>
                    <span className="font-mono text-slate-400 dark:text-slate-500 truncate">
                      {cert.certificateCode}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/certificate/${cert.certificateCode}`}
                      className="flex flex-1 items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      View
                    </Link>
                    <a
                      href={`/api/certificate/${cert.certificateCode}`}
                      download={`certificate-${cert.certificateCode}.pdf`}
                      className="flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                      aria-label="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
