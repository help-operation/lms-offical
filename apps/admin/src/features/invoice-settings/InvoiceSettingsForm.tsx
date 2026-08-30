"use client";

import { useState, useTransition } from "react";
import {
  FloppyDisk, SpinnerGap, CheckCircle,
  Building, TextAa, MapPin, Globe,
  Phone, Envelope, Megaphone,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { updateInvoiceSettingsAction } from "./actions";
import { INVOICE_KEYS, INVOICE_DEFAULTS, type InvoiceSettings, type InvoiceSettingsKey } from "./types";
import { ImagePickerField } from "@/shared/components/ImagePickerField";

// ─── Field + section config ───────────────────────────────────────────────────

interface FieldConfig {
  key: InvoiceSettingsKey;
  label: string;
  placeholder: string;
  hint: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  isImage?: boolean;
}

interface Section {
  title: string;
  fields: FieldConfig[];
}

const SECTIONS: Section[] = [
  {
    title: "Contact",
    fields: [
      {
        key: "invoice_website",
        label: "Website",
        placeholder: "www.skillkoro.com",
        hint: "Shown at the top of the invoice contact block.",
        icon: Globe,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
      },
      {
        key: "invoice_phone",
        label: "Phone",
        placeholder: "01710-710002",
        hint: "Primary contact number shown on the invoice.",
        icon: Phone,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
      },
      {
        key: "invoice_email",
        label: "Support Email",
        placeholder: "support@skillkoro.com",
        hint: "Shown in the invoice contact block.",
        icon: Envelope,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
      },
    ],
  },
  {
    title: "Footer",
    fields: [
      {
        key: "invoice_footer_tagline",
        label: "Bottom Banner Tagline",
        placeholder: "SkillKoro – Empowering You With Skills For A Better Tomorrow.",
        hint: "Shown in the dark banner strip at the very bottom of the invoice.",
        icon: Megaphone,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
      },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initial: Record<string, string>;
}

export function InvoiceSettingsForm({ initial }: Props) {
  const [form, setForm] = useState<InvoiceSettings>(() => {
    const out = { ...INVOICE_DEFAULTS };
    for (const key of INVOICE_KEYS) {
      if (initial[key] !== undefined) out[key] = initial[key]!;
    }
    return out;
  });

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(key: InvoiceSettingsKey, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const payload: Partial<InvoiceSettings> = {};
      for (const key of INVOICE_KEYS) {
        payload[key] = form[key].trim() || "";
      }
      const res = await updateInvoiceSettingsAction(payload);
      if (res.success) {
        setSaved(true);
        toast.success("Invoice settings saved");
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  const activeCount = ALL_FIELDS.filter((f) => !!form[f.key]?.trim()).length;

  return (
    <div className="space-y-6">
      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{section.title}</h2>
          {section.fields.map(({ key, label, placeholder, hint, icon: Icon, iconColor, bgColor, isImage }) => (
            <div key={key} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 ${iconColor}`}>
                  <Icon size={20} weight="fill" />
                </div>
                <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
                    {form[key]?.trim() && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">
                        <CheckCircle size={9} weight="fill" /> Set
                      </span>
                    )}
                </div>
              </div>
              {isImage ? (
                <ImagePickerField
                  value={form[key] ?? ""}
                  onChange={(v) => handleChange(key, v)}
                  placeholder={placeholder}
                  disabled={isPending}
                  previewClassName="w-32 h-12 object-contain rounded-lg border border-gray-200 dark:border-gray-600 mt-2 bg-gray-50 dark:bg-gray-700"
                />
              ) : (
                <input
                  type="text"
                  value={form[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  disabled={isPending}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/50 disabled:opacity-60 transition"
                />
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{hint}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Bottom save bar */}
      <div className="sticky bottom-4 flex items-center justify-between rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-6 py-4 shadow-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeCount} of {ALL_FIELDS.length} fields configured
        </p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 transition-colors"
        >
          {isPending ? (
            <SpinnerGap size={15} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={15} weight="fill" />
          ) : (
            <FloppyDisk size={15} weight="bold" />
          )}
          {saved && !isPending ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
