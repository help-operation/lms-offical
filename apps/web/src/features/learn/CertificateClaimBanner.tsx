"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Award, Download, Loader2 } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { certificatesApiBrowser } from "@/features/courses/api/certificates/browser";
import { ApiError } from "@/lib/api-client-browser";


interface Props {
  courseId: number;
  /** Code of the already-issued certificate (auto-issued on completion), if any. */
  initialCode: string | null;
  variant?: "recorded" | "live";
}

export function CertificateClaimBanner({ courseId, initialCode, variant = "recorded" }: Props) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [isPending, start] = useTransition();

  function handleClaim() {
    start(async () => {
      try {
        const res = variant === "live"
          ? await certificatesApiBrowser.claimLive(courseId)
          : await certificatesApiBrowser.claim(courseId);
        setCode(res.data.certificateCode);
        toast.success("Certificate issued! 🎉");
      } catch (e) {
        toast.error(
          e instanceof ApiError ? e.message : "Could not issue certificate",
        );
      }
    });
  }

  return (
    <div className="mx-auto mb-6 max-w-5xl px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-600/15 to-indigo-600/15 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-600 dark:bg-brand-600/25 dark:text-brand-300">
            <Award className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              🎉 Course complete!
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">
              {code
                ? "Your certificate is ready to view and download."
                : "You've finished every lesson — claim your certificate."}
            </p>
          </div>
        </div>

        {code ? (
          <Link
            href={`/certificate/${code}`}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            <Download className="h-4 w-4" />
            View Certificate
          </Link>
        ) : (
          <button
            onClick={handleClaim}
            disabled={isPending}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            Claim your certificate
          </button>
        )}
      </div>
    </div>
  );
}
