"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FloppyDisk, SpinnerGap, Tag, ChartBar, FacebookLogo, GoogleChromeLogo,
  MagnifyingGlass, Eye, EyeSlash, CheckCircle, Info, PencilSimple, CaretDown,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { bulkUpdateTrackingItemsAction } from "./registry-actions";
import { updateTrackingSettingsAction } from "./actions";
import type { TrackingItem, TrackingItemCategory, UpdateTrackingItemInput } from "./registry-api";

// ─── Core tag field descriptors ──────────────────────────────────────────────

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
    key: "gtmId", label: "Google Tag Manager", placeholder: "GTM-XXXXXXX",
    hint: "Paste your GTM container ID. All other scripts can be managed inside GTM — you only need this one.",
    icon: Tag, iconColor: "text-blue-600 dark:text-blue-300",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    badge: "Recommended",
  },
  {
    key: "ga4Id", label: "Google Analytics 4", placeholder: "G-XXXXXXXXXX",
    hint: "Track visitors, traffic sources, and user behaviour. Skip this if you're using GTM.",
    icon: ChartBar, iconColor: "text-orange-500 dark:text-orange-300",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
    badge: "Traffic & behaviour",
  },
  {
    key: "fbPixelId", label: "Meta / Facebook Pixel", placeholder: "1234567890123456",
    hint: "Your numeric Facebook Pixel ID. Enables conversion tracking and remarketing for Facebook & Instagram Ads.",
    icon: FacebookLogo, iconColor: "text-blue-500 dark:text-blue-300",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
    badge: "Ads & remarketing",
  },
  {
    key: "fbCapiAccessToken", label: "Meta Conversions API", placeholder: "EAAG... (access token from Events Manager)",
    hint: "Server-side event tracking — sends conversions directly from our server to Meta. Requires a Pixel ID above.",
    icon: FacebookLogo, iconColor: "text-indigo-600 dark:text-indigo-300",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300",
    badge: "Server-side · secret", type: "password",
  },
  {
    key: "fbCapiTestEventCode", label: "Meta CAPI Test Event Code", placeholder: "TEST12345",
    hint: "Optional. Paste from Events Manager → Test Events while verifying setup, then remove it.",
    icon: FacebookLogo, iconColor: "text-gray-500 dark:text-gray-400",
    badgeColor: "bg-gray-50 text-gray-600 border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300",
    badge: "Optional · testing only",
  },
  {
    key: "gadsId", label: "Google Ads", placeholder: "AW-XXXXXXXXXX",
    hint: "Your Google Ads conversion tracking ID. Measures which ad clicks lead to purchases or sign-ups.",
    icon: GoogleChromeLogo, iconColor: "text-green-600 dark:text-green-300",
    badgeColor: "bg-green-50 text-green-700 border-green-100 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300",
    badge: "Conversion tracking",
  },
  {
    key: "clarityId", label: "Microsoft Clarity", placeholder: "xxxxxxxxxx",
    hint: "Session recording and heatmaps. See exactly where users click, scroll, and drop off.",
    icon: Eye, iconColor: "text-violet-600 dark:text-violet-300",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
    badge: "Heatmaps & sessions",
  },
  {
    key: "gscVerification", label: "Google Search Console", placeholder: 'Paste the content value of the <meta name="google-site-verification" ...> tag',
    hint: "Only paste the content= value, not the full tag. e.g. abc123XYZdef.",
    icon: MagnifyingGlass, iconColor: "text-teal-600 dark:text-teal-300",
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

// ─── Events section constants ────────────────────────────────────────────────

const EVENT_CATEGORY_ORDER: TrackingItemCategory[] = ["ecommerce_event", "content_engagement", "user_data", "consent"];

const CATEGORY_LABELS: Record<TrackingItemCategory, string> = {
  core_tag: "Core Tags",
  ecommerce_event: "Ecommerce Events",
  content_engagement: "Content & Engagement",
  user_data: "User Data",
  consent: "Consent",
};

const HINTS: Record<string, string> = {
  event_page_view: "Fires on every client-side navigation — without this, GTM only sees the very first page of a visit.",
  event_view_item: "Fires when a student opens a course or live-class landing page.",
  event_view_item_list: "Fires once when the /courses listing page loads.",
  event_select_item: "Fires when a student clicks a course card in a listing.",
  event_add_to_cart: "Fires when a student clicks Enroll, before checkout starts.",
  event_remove_from_cart: "Fires when a student removes a course from their cart.",
  event_begin_checkout: "Fires when the checkout page loads with items in it.",
  event_purchase: "Fires once payment succeeds — the most important conversion event.",
  event_sign_up: "Fires when a new account is created.",
  event_login: "Fires on successful login.",
  event_view_cart: "Fires when a student opens the cart page with items in it.",
  event_add_payment_info: "Fires right before redirecting to the payment gateway.",
  event_add_shipping_info: "For flows with a shipping step — not used by digital courses today.",
  content_context: "Pushes page type, category, and author into the dataLayer on every page view.",
  user_context: "Pushes a hashed customer profile (login state, role, order history) — never raw email or phone.",
  enhanced_conversions: "For Google Ads/GA4 conversion matching. Pushes PLAIN email, phone, and name. Only enable if you're using Google Ads.",
  engagement_search: "Fires when a student searches the course catalog, with the query and result count.",
  engagement_scroll: "Fires at 25/50/75/90% scroll depth on course and blog pages.",
  engagement_video: "Fires start/progress/pause/complete for native lesson preview video players.",
  consent_mode: "Google Consent Mode v2 — gates every tag above on visitor consent. Recommended to leave on.",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  initialItems: TrackingItem[];
  initialGscVerification: string | null;
}

export function TrackingCoreTagsForm({ initialItems, initialGscVerification }: Props) {
  const [items, setItems] = useState<TrackingItem[]>(initialItems);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ core: true, events: false });

  function toggle(section: string) {
    setExpanded((p) => ({ ...p, [section]: !p[section] }));
  }

  return (
    <div className="space-y-4">
      {/* GTM notice */}
      <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
        <Info size={16} weight="fill" className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-300" />
        <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-200">
          <strong>Pro tip:</strong> If you add a GTM ID, Google Tag Manager will control all other
          scripts from its own dashboard — you don&apos;t need to fill in GA4, Pixel, or Clarity
          here separately. Only fill those in if you&apos;re not using GTM.
        </p>
      </div>

      {/* Core Tags section */}
      <CoreTagsSection
        items={items}
        initialGscVerification={initialGscVerification}
        isOpen={expanded.core ?? false}
        onToggle={() => toggle("core")}
        onItemsSaved={setItems}
      />

      {/* Events section */}
      <EventsSection
        items={items}
        isOpen={expanded.events ?? false}
        onToggle={() => toggle("events")}
        onItemsSaved={setItems}
      />
    </div>
  );
}

// ─── Core Tags inline section ────────────────────────────────────────────────

function CoreTagsSection({
  items,
  initialGscVerification,
  isOpen,
  onToggle,
  onItemsSaved,
}: {
  items: TrackingItem[];
  initialGscVerification: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onItemsSaved: (updated: TrackingItem[]) => void;
}) {
  const [form, setForm] = useState<Record<FieldKey, string>>(() => buildInitialForm(items, initialGscVerification));
  const [isPending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Set<string>>(new Set());

  const isDirty = useMemo(() => {
    const original = buildInitialForm(items, initialGscVerification);
    return FIELDS.some((f) => (form[f.key] ?? "") !== (original[f.key] ?? ""));
  }, [form, items, initialGscVerification]);

  const setCount = FIELDS.filter((f) => (form[f.key] ?? "").trim()).length;

  function handleChange(key: FieldKey, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  function handleReset() {
    setForm(buildInitialForm(items, initialGscVerification));
    setEditing(new Set());
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
            key: "fb_pixel", enabled: !!fbPixelId,
            config: { id: fbPixelId, capiAccessToken: fbCapiAccessToken, capiTestEventCode: fbCapiTestEventCode },
          },
          { key: "gads", enabled: !!gadsId, config: { id: gadsId } },
          { key: "clarity", enabled: !!clarityId, config: { id: clarityId } },
        ]),
        updateTrackingSettingsAction({ gscVerification: gscVerification || null }),
      ]);

      if (itemsRes.success && settingsRes.success) {
        onItemsSaved(items.map((i) => itemsRes.data.find((u) => u.key === i.key) ?? i));
        setEditing(new Set());
        toast.success("Tracking IDs saved");
      } else {
        toast.error(itemsRes.success ? settingsRes.message : itemsRes.message ?? "Failed to save");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shadow-sm ring-1 ring-black/5 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-white/10">
          <Tag size={18} weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Core Tags</h3>
            {setCount > 0 && (
              <CheckCircle size={14} weight="fill" className="shrink-0 text-green-500 dark:text-green-400" />
            )}
          </div>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">Tracking IDs — GTM, GA4, Meta Pixel, Ads, Clarity, GSC</p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">{setCount}/8</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                setCount === 8 ? "bg-green-500 dark:bg-green-400" : "bg-brand-500 dark:bg-brand-400"
              }`}
              style={{ width: `${Math.round((setCount / 8) * 100)}%` }}
            />
          </div>
        </div>
        <CaretDown
          size={16} weight="bold"
          className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-gray-100 px-5 py-5 dark:border-slate-800">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                {FIELDS.map(({ key, label, placeholder, hint, icon: Icon, iconColor, badge, badgeColor, type }) => {
                  const value = form[key] ?? "";
                  const isSet = !!value.trim();
                  const isRevealed = revealed.has(key);
                  const isSecret = type === "password";
                  const isEditing = editing.has(key);
                  const isLocked = !isEditing;

                  return (
                    <div key={key} className={isSecret ? "" : ""}>
                      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
                          {badge}
                        </span>
                        {isSet && (
                          <CheckCircle size={13} weight="fill" className="shrink-0 text-green-500 dark:text-green-400" />
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
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-16 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40"
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

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                {isDirty && (
                  <button
                    onClick={handleReset}
                    disabled={isPending}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isPending || !isDirty}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
                >
                  {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
                  {isPending ? "Saving..." : isDirty ? "Save" : "No changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Events inline section ───────────────────────────────────────────────────

function EventsSection({
  items,
  isOpen,
  onToggle,
  onItemsSaved,
}: {
  items: TrackingItem[];
  isOpen: boolean;
  onToggle: () => void;
  onItemsSaved: (updated: TrackingItem[]) => void;
}) {
  const eventItems = useMemo(() => items.filter((i) => i.category !== "core_tag"), [items]);
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(eventItems.map((i) => [i.key, i.enabled])),
  );
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => eventItems.some((i) => values[i.key] !== i.enabled),
    [values, eventItems],
  );

  const enabledCount = eventItems.filter((i) => values[i.key]).length;

  const grouped = useMemo(() => {
    const map = new Map<TrackingItemCategory, TrackingItem[]>();
    for (const cat of EVENT_CATEGORY_ORDER) map.set(cat, []);
    for (const item of eventItems) map.get(item.category)?.push(item);
    return map;
  }, [eventItems]);

  function toggle(key: string) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleReset() {
    setValues(Object.fromEntries(eventItems.map((i) => [i.key, i.enabled])));
  }

  function handleSave() {
    const updates: UpdateTrackingItemInput[] = eventItems
      .filter((i) => values[i.key] !== i.enabled)
      .map((i) => ({ key: i.key, enabled: values[i.key] }));
    if (updates.length === 0) return;

    startTransition(async () => {
      const res = await bulkUpdateTrackingItemsAction(updates);
      if (res.success) {
        const merged = items.map((i) => res.data.find((u) => u.key === i.key) ?? i);
        onItemsSaved(merged);
        toast.success("Event settings saved");
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.03, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 shadow-sm ring-1 ring-black/5 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-white/10">
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">dataLayer Events</h3>
            {isDirty && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">Ecommerce events, engagement signals, user data & consent</p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
            {enabledCount}/{eventItems.length} enabled
          </span>
        </div>
        <CaretDown
          size={16} weight="bold"
          className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-gray-100 px-5 py-5 dark:border-slate-800">
              <div className="space-y-6">
                {EVENT_CATEGORY_ORDER.map((category) => {
                  const categoryItems = grouped.get(category) ?? [];
                  if (categoryItems.length === 0) return null;
                  return (
                    <div key={category}>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {CATEGORY_LABELS[category]}
                      </h3>
                      <div className="space-y-3">
                        {categoryItems.map((item) => {
                          const enabled = values[item.key];
                          return (
                            <div
                              key={item.key}
                              className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/50"
                            >
                              <button
                                type="button"
                                role="switch"
                                aria-checked={enabled}
                                aria-label={`${enabled ? "Disable" : "Enable"} ${item.label}`}
                                onClick={() => toggle(item.key)}
                                disabled={isPending}
                                className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${
                                  enabled ? "bg-brand-600" : "bg-gray-300 dark:bg-slate-700"
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                    enabled ? "translate-x-4" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                                  <code className="rounded bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:bg-slate-700 dark:text-gray-400">
                                    {item.key}
                                  </code>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{HINTS[item.key] ?? ""}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                {isDirty && (
                  <button
                    onClick={handleReset}
                    disabled={isPending}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isPending || !isDirty}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
                >
                  {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
                  {isPending ? "Saving..." : isDirty ? "Save" : "No changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
