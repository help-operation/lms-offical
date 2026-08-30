"use client";

import { useState, useTransition } from "react";
import {
  FloppyDisk,
  SpinnerGap,
  Tag,
  ChartBar,
  FacebookLogo,
  GoogleChromeLogo,
  MagnifyingGlass,
  Eye,
  EyeSlash,
  CheckCircle,
  Info,
  PencilSimple,
  Sliders,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { bulkUpdateTrackingItemsAction } from "./registry-actions";
import { updateTrackingSettingsAction } from "./actions";
import { RegistryEventsModal } from "./RegistryEventsModal";
import type { TrackingItem } from "./registry-api";

// ─── Field descriptor ─────────────────────────────────────────────────────────
// Mirrors the pre-registry TrackingSettingsForm layout (icons, badges, pencil-to-edit)
// but each field now reads/writes a tracking_items registry row's `config`, and a
// non-empty value is what makes the tag "live" — no separate enable switch for these,
// same as the original ID-presence-is-the-toggle UX.

type FieldKey = "gtmId" | "ga4Id" | "fbPixelId" | "fbCapiAccessToken" | "fbCapiTestEventCode" | "gadsId" | "clarityId" | "gscVerification";

interface FieldConfig {
  key: FieldKey;
  label: string;
  placeholder: string;
  hint: string;
  icon: React.ElementType;
  iconColor: string;
  badgeColor: string;
  badge: string;
  type?: "text" | "password";
}

const FIELDS: FieldConfig[] = [
  {
    key: "gtmId",
    label: "Google Tag Manager",
    placeholder: "GTM-XXXXXXX",
    hint: "Paste your GTM container ID. All other scripts can be managed inside GTM — you only need this one.",
    icon: Tag,
    iconColor: "text-blue-600 dark:text-blue-300",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    badge: "Recommended — controls everything",
  },
  {
    key: "ga4Id",
    label: "Google Analytics 4",
    placeholder: "G-XXXXXXXXXX",
    hint: "Track visitors, traffic sources, and user behaviour. Skip this if you're using GTM (add GA4 inside GTM instead).",
    icon: ChartBar,
    iconColor: "text-orange-500 dark:text-orange-300",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
    badge: "Traffic & behaviour",
  },
  {
    key: "fbPixelId",
    label: "Meta / Facebook Pixel",
    placeholder: "1234567890123456",
    hint: "Your numeric Facebook Pixel ID. Enables conversion tracking and remarketing for Facebook & Instagram Ads.",
    icon: FacebookLogo,
    iconColor: "text-blue-500 dark:text-blue-300",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    badge: "Ads & remarketing",
  },
  {
    key: "fbCapiAccessToken",
    label: "Meta Conversions API",
    placeholder: "EAAG... (access token from Events Manager)",
    hint: "Server-side event tracking — sends conversions directly from our server to Meta, bypassing ad blockers and iOS tracking limits. Requires a Pixel ID above. Get this token from Events Manager → your Pixel → Settings → Conversions API.",
    icon: FacebookLogo,
    iconColor: "text-indigo-600 dark:text-indigo-300",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300",
    badge: "Server-side · secret",
    type: "password",
  },
  {
    key: "fbCapiTestEventCode",
    label: "Meta CAPI Test Event Code",
    placeholder: "TEST12345",
    hint: "Optional. Paste from Events Manager → Test Events while verifying setup, then remove it once events show as received.",
    icon: FacebookLogo,
    iconColor: "text-gray-500 dark:text-gray-400",
    badgeColor: "bg-gray-50 text-gray-600 border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300",
    badge: "Optional · testing only",
  },
  {
    key: "gadsId",
    label: "Google Ads",
    placeholder: "AW-XXXXXXXXXX",
    hint: "Your Google Ads conversion tracking ID. Measures which ad clicks lead to purchases or sign-ups.",
    icon: GoogleChromeLogo,
    iconColor: "text-green-600 dark:text-green-300",
    badgeColor: "bg-green-50 text-green-700 border-green-100 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300",
    badge: "Conversion tracking",
  },
  {
    key: "clarityId",
    label: "Microsoft Clarity",
    placeholder: "xxxxxxxxxx",
    hint: "Session recording and heatmaps. See exactly where users click, scroll, and drop off.",
    icon: Eye,
    iconColor: "text-violet-600 dark:text-violet-300",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
    badge: "Heatmaps & sessions",
  },
  {
    key: "gscVerification",
    label: "Google Search Console",
    placeholder: "Paste the content value of the <meta name=\"google-site-verification\" ...> tag",
    hint: "Only paste the content= value, not the full tag. e.g. abc123XYZdef. Used to verify ownership with Google Search Console.",
    icon: MagnifyingGlass,
    iconColor: "text-teal-600 dark:text-teal-300",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-100 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300",
    badge: "SEO & indexing",
  },
];

function findItem(items: TrackingItem[], key: string) {
  return items.find((i) => i.key === key);
}

function buildInitialForm(items: TrackingItem[], gscVerification: string | null): Record<FieldKey, string> {
  return {
    gtmId: (findItem(items, "gtm")?.config.id as string) ?? "",
    ga4Id: (findItem(items, "ga4")?.config.id as string) ?? "",
    fbPixelId: (findItem(items, "fb_pixel")?.config.id as string) ?? "",
    fbCapiAccessToken: (findItem(items, "fb_pixel")?.config.capiAccessToken as string) ?? "",
    fbCapiTestEventCode: (findItem(items, "fb_pixel")?.config.capiTestEventCode as string) ?? "",
    gadsId: (findItem(items, "gads")?.config.id as string) ?? "",
    clarityId: (findItem(items, "clarity")?.config.id as string) ?? "",
    gscVerification: gscVerification ?? "",
  };
}

interface Props {
  initialItems: TrackingItem[];
  initialGscVerification: string | null;
}

export function TrackingCoreTagsForm({ initialItems, initialGscVerification }: Props) {
  const [items, setItems] = useState<TrackingItem[]>(initialItems);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [form, setForm] = useState<Record<FieldKey, string>>(() => buildInitialForm(initialItems, initialGscVerification));

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Set<string>>(new Set());

  function handleChange(key: FieldKey, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleReveal(key: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function startEditing(key: string) {
    setEditing((prev) => new Set(prev).add(key));
  }

  function handleSave() {
    startTransition(async () => {
      const gtmId = form.gtmId.trim();
      const ga4Id = form.ga4Id.trim();
      const fbPixelId = form.fbPixelId.trim();
      const fbCapiAccessToken = form.fbCapiAccessToken.trim();
      const fbCapiTestEventCode = form.fbCapiTestEventCode.trim();
      const gadsId = form.gadsId.trim();
      const clarityId = form.clarityId.trim();
      const gscVerification = form.gscVerification.trim();

      const [itemsRes, settingsRes] = await Promise.all([
        bulkUpdateTrackingItemsAction([
          { key: "gtm", enabled: !!gtmId, config: { id: gtmId } },
          { key: "ga4", enabled: !!ga4Id, config: { id: ga4Id } },
          {
            key: "fb_pixel",
            enabled: !!fbPixelId,
            config: { id: fbPixelId, capiAccessToken: fbCapiAccessToken, capiTestEventCode: fbCapiTestEventCode },
          },
          { key: "gads", enabled: !!gadsId, config: { id: gadsId } },
          { key: "clarity", enabled: !!clarityId, config: { id: clarityId } },
        ]),
        updateTrackingSettingsAction({ gscVerification: gscVerification || null }),
      ]);

      if (itemsRes.success && settingsRes.success) {
        setItems((prev) => prev.map((i) => itemsRes.data.find((u) => u.key === i.key) ?? i));
        setSaved(true);
        setEditing(new Set());
        toast.success("Tracking settings saved");
      } else {
        toast.error(itemsRes.success ? settingsRes.message : itemsRes.message ?? "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* GTM notice */}
      <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
        <Info size={16} weight="fill" className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-300" />
        <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-200">
          <strong>Pro tip:</strong> If you add a GTM ID, Google Tag Manager will control all other
          scripts from its own dashboard — you don&apos;t need to fill in GA4, Pixel, or Clarity
          here separately. Only fill those in if you&apos;re not using GTM.
        </p>
      </div>

      {/* Fields */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, placeholder, hint, icon: Icon, iconColor, badge, badgeColor, type }, idx) => {
            const value = form[key] ?? "";
            const isSet = !!value.trim();
            const isRevealed = revealed.has(key);
            const isSecret = type === "password";
            const isEditing = editing.has(key);
            // Every field starts locked (read-only) until its pencil icon is
            // clicked — avoids accidentally overtyping a saved value while
            // scrolling or clicking around the form.
            const isLocked = !isEditing;

            return (
              <div
                key={key}
                style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
                className="list-item-in"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
                    {badge}
                  </span>
                  {isSet && (
                    <CheckCircle size={13} weight="fill" className="shrink-0 text-green-500 dark:text-green-400" />
                  )}
                  {key === "gtmId" && (
                    <button
                      type="button"
                      onClick={() => setShowEventsModal(true)}
                      className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                    >
                      <Sliders size={11} weight="bold" />
                      Events
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Icon size={15} weight="fill" className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${iconColor}`} />
                  <input
                    type={isSecret && !isRevealed ? "password" : "text"}
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    disabled={isPending || isLocked}
                    spellCheck={false}
                    className={`w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40 pr-16`}
                  />
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {isSecret && isEditing && (
                      <button
                        type="button"
                        onClick={() => toggleReveal(key)}
                        aria-label={isRevealed ? "Hide value" : "Show value"}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                      >
                        {isRevealed ? <EyeSlash size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(key)}
                      aria-label={`Edit ${label}`}
                      disabled={isEditing}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:bg-slate-700 dark:hover:text-gray-300"
                    >
                      <PencilSimple size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">{hint}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950 sm:w-auto"
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

      {showEventsModal && (
        <RegistryEventsModal
          initial={items}
          onClose={() => setShowEventsModal(false)}
          onSaved={(updated) => setItems(updated)}
        />
      )}
    </div>
  );
}
