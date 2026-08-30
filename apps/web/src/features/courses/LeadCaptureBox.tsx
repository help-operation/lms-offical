"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { createInterestLeadAction } from "@/features/leads/actions/leads.actions";

const COUNTRIES = [
  { code: "BD", flag: "🇧🇩", dial: "+880" },
  { code: "IN", flag: "🇮🇳", dial: "+91" },
  { code: "PK", flag: "🇵🇰", dial: "+92" },
  { code: "AE", flag: "🇦🇪", dial: "+971" },
  { code: "SA", flag: "🇸🇦", dial: "+966" },
  { code: "MY", flag: "🇲🇾", dial: "+60" },
  { code: "GB", flag: "🇬🇧", dial: "+44" },
  { code: "US", flag: "🇺🇸", dial: "+1" },
];

interface Props {
  /** Course the visitor is browsing — saved with the lead so admin knows the context. */
  courseId: number;
}

export function LeadCaptureBox({ courseId }: Props) {
  const [country, setCountry] = useState(COUNTRIES[0]!);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setError("Enter a valid mobile number");
      return;
    }
    setError("");

    // Combine dial code + national digits so admin sees a complete number
    const fullPhone = `${country.dial}${digits}`;

    startTransition(async () => {
      const res = await createInterestLeadAction({
        phone: fullPhone,
        courseId,
      });
      if (res.success) {
        setSent(true);
      } else {
        setError(res.message ?? "Couldn't submit. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-brand-300 bg-brand-50/40 p-4">
      <p className="text-center text-sm font-bold text-brand-700">
        To get more discounts &amp; course info
      </p>

      {sent ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" />
          Thanks! We&rsquo;ll contact you soon.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3">
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">
            Mobile number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:border-brand-400">
              {/* Country selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="flex h-full items-center gap-1 border-r border-gray-200 px-2 text-sm"
                >
                  <span>{country.flag}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
                {open && (
                  <ul className="absolute left-0 top-full z-20 mt-1 max-h-56 w-44 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {COUNTRIES.map((c) => (
                      <li key={c.code}>
                        <button
                          type="button"
                          onClick={() => {
                            setCountry(c);
                            setOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50"
                        >
                          <span>{c.flag}</span>
                          <span className="text-gray-700">{c.code}</span>
                          <span className="ml-auto text-gray-400">{c.dial}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="flex items-center pl-2 text-sm text-gray-500">
                {country.dial}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1XXXXXXXXX"
                className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-from to-brand-to px-4 text-sm font-bold text-white shadow-sm transition-all hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </form>
      )}
    </div>
  );
}
