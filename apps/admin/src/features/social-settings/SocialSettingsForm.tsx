"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FloppyDisk, SpinnerGap, CheckCircle, ArrowCounterClockwise, WarningCircle, Monitor,
  FacebookLogo, YoutubeLogo, InstagramLogo, LinkedinLogo, TwitterLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { updateSocialSettingsAction } from "./actions";
import { SOCIAL_KEYS, SOCIAL_DEFAULTS, type SocialSettings } from "./types";

// ─── Field config ─────────────────────────────────────────────────────────────

interface FieldConfig {
  key: keyof SocialSettings;
  label: string;
  placeholder: string;
  hint: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: "social_facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/yourpage",
    hint: "Full URL of your Facebook page or group.",
    icon: FacebookLogo,
    iconColor: "text-blue-600 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    key: "social_youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
    hint: "Full URL of your YouTube channel.",
    icon: YoutubeLogo,
    iconColor: "text-red-600 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-500/10",
  },
  {
    key: "social_whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/8801700000000",
    hint: "WhatsApp chat link. Format: https://wa.me/<number> (no +, dashes, or spaces).",
    icon: WhatsappLogo,
    iconColor: "text-green-600 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-500/10",
  },
  {
    key: "social_instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourhandle",
    hint: "Full URL of your Instagram profile.",
    icon: InstagramLogo,
    iconColor: "text-pink-600 dark:text-pink-300",
    bgColor: "bg-pink-50 dark:bg-pink-500/10",
  },
  {
    key: "social_linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/yourcompany",
    hint: "Full URL of your LinkedIn company or personal page.",
    icon: LinkedinLogo,
    iconColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    key: "social_twitter",
    label: "Twitter / X",
    placeholder: "https://x.com/yourhandle",
    hint: "Full URL of your Twitter/X profile.",
    icon: TwitterLogo,
    iconColor: "text-sky-500 dark:text-sky-300",
    bgColor: "bg-sky-50 dark:bg-sky-500/10",
  },
];

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initial: Record<string, string>;
}

export function SocialSettingsForm({ initial }: Props) {
  const startingValues = useMemo(() => {
    const out = { ...SOCIAL_DEFAULTS };
    for (const key of SOCIAL_KEYS) {
      if (initial[key] !== undefined) out[key] = initial[key]!;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState<SocialSettings>(startingValues);
  const [savedValues, setSavedValues] = useState<SocialSettings>(startingValues);

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isDirty = useMemo(
    () => SOCIAL_KEYS.some((k) => form[k] !== savedValues[k]),
    [form, savedValues],
  );

  const invalidKeys = useMemo(
    () => SOCIAL_KEYS.filter((k) => !isValidUrl(form[k] ?? "")),
    [form],
  );

  function handleChange(key: keyof SocialSettings, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function handleReset() {
    setForm(savedValues);
    setSaved(false);
  }

  function handleSave() {
    if (invalidKeys.length > 0) {
      toast.error("Fix the invalid URLs before saving");
      return;
    }
    startTransition(async () => {
      const payload: Partial<SocialSettings> = {};
      for (const key of SOCIAL_KEYS) {
        payload[key] = form[key].trim() || "";
      }
      const res = await updateSocialSettingsAction(payload);
      if (res.success) {
        setSavedValues(form);
        setSaved(true);
        toast.success("Social links saved");
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  const activeCount = SOCIAL_KEYS.filter((k) => !!form[k]?.trim() && isValidUrl(form[k])).length;

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800">
          <Monitor className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Preview</p>
        </div>
        <div className="p-4">
          {activeCount === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400 dark:border-slate-700 dark:text-gray-500">
              Add a link below to see it previewed here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 rounded-lg bg-gray-50 p-4 dark:bg-slate-800/50">
              {FIELDS.filter((f) => form[f.key]?.trim() && isValidUrl(form[f.key])).map(({ key, label, icon: Icon, iconColor, bgColor }) => (
                <span
                  key={key}
                  title={form[key]}
                  className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm ${bgColor} ${iconColor}`}
                >
                  <Icon size={16} weight="fill" />
                  <span className="sr-only">{label}</span>
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
            Approximate preview of how these icons appear in the site footer. Actual styling may vary.
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, placeholder, hint, icon: Icon, iconColor }, idx) => {
            const value = form[key] ?? "";
            const invalid = !isValidUrl(value);
            return (
              <div key={key} style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }} className="list-item-in">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                  {value.trim() && !invalid && (
                    <CheckCircle size={13} weight="fill" className="shrink-0 text-green-500 dark:text-green-400" />
                  )}
                  {invalid && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                      <WarningCircle size={11} weight="fill" /> Invalid URL
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Icon size={15} weight="fill" className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${iconColor}`} />
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    disabled={isPending}
                    aria-invalid={invalid}
                    className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 ${
                      invalid
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-500/40 dark:focus:border-red-500 dark:focus:ring-red-900/40"
                        : "border-gray-200 focus:border-brand-400 focus:ring-brand-100 dark:border-slate-700 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
                    }`}
                  />
                </div>
                {invalid ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-red-600 dark:text-red-400">
                    Enter a full URL starting with http:// or https://
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">{hint}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {isDirty && (
          <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 sm:mr-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        )}
        {isDirty && (
          <button
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            <ArrowCounterClockwise size={15} weight="bold" />
            Reset
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || !isDirty || invalidKeys.length > 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          {isPending ? (
            <SpinnerGap size={15} className="animate-spin" />
          ) : saved && !isDirty ? (
            <CheckCircle size={15} weight="fill" />
          ) : (
            <FloppyDisk size={15} weight="bold" />
          )}
          {isPending ? "Saving…" : saved && !isDirty ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
