"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export function VerifyForm({ certPrefix = "SKL" }: { certPrefix?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setSubmitting(true);
    router.push(`/certificate/${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400 dark:text-brand-500" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`e.g. ${certPrefix}-A3F7B2D1E9C4`}
          autoFocus
          spellCheck={false}
          autoCapitalize="characters"
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm font-mono uppercase tracking-wide text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !code.trim()}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Verifying…" : "Verify Certificate"}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
