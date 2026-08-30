import { notFound } from "next/navigation";
import { publicApiRequest } from "@/lib/api-client";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSiteSettings } from "@/features/cms/api/settings";

interface CertificateData {
  id: number;
  certificateCode: string;
  certificateUrl: string | null;
  issuedAt: string | null;
  userId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
}

async function getCertificate(code: string): Promise<CertificateData | null> {
  try {
    const res = await publicApiRequest<CertificateData>(`/certificates/verify/${code}`, {
      next: { revalidate: 3600 },
    });
    return res.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const cert = await getCertificate(code);
  if (!cert) return { title: "Certificate Not Found" };
  return {
    title: `${cert.studentName} — ${cert.courseTitle} — Certificate`,
    description: `Verified certificate of completion for ${cert.courseTitle} issued to ${cert.studentName}.`,
  };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [cert, siteSettings] = await Promise.all([getCertificate(code), getPublicSiteSettings()]);
  if (!cert) notFound();

  const siteName = siteSettings.site_name || "Skillkoro";

  const issuedDate = cert.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const pdfUrl = `/api/certificate/${cert.certificateCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 transition-colors duration-300 animate-content-in dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <span className="text-white text-xs font-black">S</span>
            </div>
            {siteName}
          </Link>
          <a
            href={pdfUrl}
            download={`certificate-${cert.certificateCode}.pdf`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z"/>
            </svg>
            Download PDF
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 space-y-8">
        {/* Verification badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-6 py-3.5 dark:border-green-500/20 dark:bg-green-500/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 256 256">
                <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">Certificate Verified</p>
              <p className="text-xs text-green-600 dark:text-green-400">This is an authentic {siteName} certificate</p>
            </div>
          </div>
        </div>

        {/* Certificate card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
          {/* Top decoration */}
          <div className="h-2 bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-500" />

          <div className="p-12 text-center space-y-6">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#7c3aed" className="dark:fill-[#a78bfa]" viewBox="0 0 256 256">
                  <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,219,72H168V64a8,8,0,0,0-8-8H40A16,16,0,0,0,24,72V184a16,16,0,0,0,16,16H56.37A24,24,0,0,0,104,184h48a24,24,0,0,0,47.63-16H216a16,16,0,0,0,16-16V128A8,8,0,0,0,247.42,117ZM168,88h51a.2.2,0,0,1,.13.07L230.67,120H168ZM40,184V72H152v88H104A24.11,24.11,0,0,0,80.37,184Zm56,24a8,8,0,1,1,8-8A8,8,0,0,1,96,208Zm80,0a8,8,0,1,1,8-8A8,8,0,0,1,176,208Zm40-40H199.63A24.11,24.11,0,0,0,176,152H168V136h56Z"/>
                </svg>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400 mb-2">
                Certificate of Completion
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400">This is to certify that</p>
            </div>

            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{cert.studentName}</h1>
            </div>

            <div>
              <p className="text-base text-gray-500 dark:text-gray-400">has successfully completed the course</p>
              <h2 className="text-2xl font-bold text-brand-700 dark:text-brand-400 mt-2">{cert.courseTitle}</h2>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-200 dark:border-brand-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#7c3aed" className="dark:fill-[#a78bfa]" viewBox="0 0 256 256">
                  <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8V112a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,40,179.31V200H224A8,8,0,0,1,232,208Z"/>
                </svg>
              </div>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Issued On</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{issuedDate}</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10">
                <p className="text-xs font-semibold text-brand-400 dark:text-brand-400 uppercase tracking-wide mb-1">Certificate ID</p>
                <p className="text-sm font-bold font-mono text-brand-800 dark:text-brand-300">{cert.certificateCode}</p>
              </div>
            </div>

            {/* Signature area */}
            <div className="flex items-end justify-center gap-16 pt-4">
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <span className="text-2xl font-black italic text-gray-700 dark:text-gray-300" style={{ fontFamily: "serif" }}>{siteName}</span>
                </div>
                <div className="h-px w-32 bg-gray-300 dark:bg-gray-700 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 dark:text-gray-500">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-500" />
        </div>

        {/* Action row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={pdfUrl}
            download={`certificate-${cert.certificateCode}.pdf`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-6 py-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z"/>
            </svg>
            Download Certificate PDF
          </a>
          <Link
            href={`/courses/${cert.courseSlug}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-6 py-3 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            View Course
          </Link>
        </div>

        {/* Verification footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Verify this certificate at{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              skillkoro.com/certificate/{cert.certificateCode}
            </code>
          </p>
        </div>
      </main>
    </div>
  );
}
