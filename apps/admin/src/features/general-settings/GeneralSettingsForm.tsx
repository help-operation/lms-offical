"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  FloppyDisk, SpinnerGap, CheckCircle, X, CaretRight,
  Globe, EnvelopeSimple, Phone, MapPin, Image as ImageIcon, Star, ShoppingCart, PlayCircle, WhatsappLogo,
  Palette, Clock, Buildings, IdentificationBadge, FileText, TextAa,
} from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { updateGeneralSettingsAction } from "./actions";
import { GENERAL_DEFAULTS, type GeneralSettings, type GeneralSettingsKey } from "./types";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import { ENGLISH_FONTS, BANGLA_FONTS } from "@/shared/utils/font-registry";

// ─── Field + category config ──────────────────────────────────────────────────

interface FieldConfig {
  key: GeneralSettingsKey;
  label: string;
  placeholder: string;
  hint: string;
  icon: React.ElementType;
  iconColor: string;
  type?: string;
  isImage?: boolean;
  isDocument?: boolean;
  isColor?: boolean;
  /** Span both grid columns — for long-form fields regardless of type. */
  wide?: boolean;
  options?: { value: string; label: string }[];
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: { bg: string; text: string; darkBg: string; darkText: string };
  fields: FieldConfig[];
}

const CATEGORIES: Category[] = [
  {
    id: "branding",
    title: "Branding",
    description: "Site name, tagline, logo & favicon",
    icon: Star,
    color: { bg: "bg-brand-100", text: "text-brand-600", darkBg: "dark:bg-brand-500/10", darkText: "dark:text-brand-300" },
    fields: [
      { key: "general_site_name", label: "Site Name", placeholder: "Site Name", hint: "Displayed in the browser tab, emails, and footer branding.", icon: Globe, iconColor: "text-brand-600 dark:text-brand-400" },
      { key: "general_tagline", label: "Tagline", placeholder: "Learn. Grow. Succeed.", hint: "Short motto shown in the footer and metadata.", icon: Star, iconColor: "text-amber-500 dark:text-amber-300" },
      { key: "general_meta_description", label: "Meta Description", placeholder: "Join 56K+ learners. 200+ expert-led courses across development, design, marketing and more.", hint: "SEO description shown in search results for the homepage.", icon: FileText, iconColor: "text-slate-500 dark:text-slate-300", wide: true },
      { key: "general_logo_url", label: "Logo (Light Mode)", placeholder: "https://cdn.example.com/logo.png", hint: "Shown when the site is in light mode (PNG or SVG, transparent background recommended).", icon: ImageIcon, iconColor: "text-blue-500 dark:text-blue-300", isImage: true },
      { key: "general_logo_url_dark", label: "Logo (Dark Mode)", placeholder: "https://cdn.example.com/logo-dark.png", hint: "Shown when the site is in dark mode. Leave blank to reuse the light mode logo.", icon: ImageIcon, iconColor: "text-indigo-500 dark:text-indigo-300", isImage: true },
      { key: "general_favicon_url", label: "Favicon URL", placeholder: "https://cdn.example.com/favicon.ico", hint: "Favicon shown in browser tabs. 32×32 or 64×64 ICO/PNG.", icon: ImageIcon, iconColor: "text-teal-500 dark:text-teal-300", isImage: true },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    description: "Email, phone numbers & address",
    icon: EnvelopeSimple,
    color: { bg: "bg-green-100", text: "text-green-600", darkBg: "dark:bg-green-500/10", darkText: "dark:text-green-300" },
    fields: [
      { key: "general_contact_email", label: "Contact Email", placeholder: "Contact Email", hint: "Shown on the contact page and used for support links.", icon: EnvelopeSimple, iconColor: "text-green-600 dark:text-green-300", type: "email" },
      { key: "general_contact_phone", label: "Contact Phone", placeholder: "+880 1700-000000", hint: "Primary phone number shown in the topbar, contact page, and footer.", icon: Phone, iconColor: "text-orange-500 dark:text-orange-300", type: "tel" },
      { key: "general_contact_phone2", label: "Contact Phone 2", placeholder: "+880 1800-000000", hint: "Secondary / mobile number shown alongside the primary phone in the topbar.", icon: Phone, iconColor: "text-orange-400 dark:text-orange-300", type: "tel" },
      { key: "general_support_whatsapp", label: "WhatsApp URL", placeholder: "https://wa.me/8801700000000", hint: "Used on course pages, checkout success, and the callback widget. Format: https://wa.me/<number>", icon: WhatsappLogo, iconColor: "text-green-500 dark:text-green-300", wide: true },
      { key: "general_address", label: "Address", placeholder: "Dhaka, Bangladesh", hint: "Physical address shown on the contact page.", icon: MapPin, iconColor: "text-red-500 dark:text-red-300", wide: true },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Copyright & trade licence",
    icon: Globe,
    color: { bg: "bg-gray-100", text: "text-gray-600", darkBg: "dark:bg-slate-800", darkText: "dark:text-gray-300" },
    fields: [
      { key: "general_copyright", label: "Copyright Text", placeholder: "LMS. All rights reserved.", hint: "Shown in the footer bottom bar. “© <current year>” is added automatically — just type the text after it.", icon: Globe, iconColor: "text-gray-500 dark:text-gray-400", wide: true },
      { key: "general_trade_license", label: "Trade Licence", placeholder: "Trade Licence Number TRAD/DNCC/000000/2024", hint: "Shown in the footer bottom bar alongside copyright.", icon: Globe, iconColor: "text-gray-500 dark:text-gray-400", wide: true },
    ],
  },
  {
    id: "business",
    title: "Business Info",
    description: "Company details, tax IDs & shop documents",
    icon: Buildings,
    color: { bg: "bg-cyan-100", text: "text-cyan-600", darkBg: "dark:bg-cyan-500/10", darkText: "dark:text-cyan-300" },
    fields: [
      { key: "general_company_name", label: "Company Name", placeholder: "Company Name", hint: "Legal / registered name of your business, used on invoices and legal pages.", icon: Buildings, iconColor: "text-cyan-600 dark:text-cyan-300" },
      { key: "general_business_country", label: "Country", placeholder: "Bangladesh", hint: "Country where your business is registered.", icon: Globe, iconColor: "text-blue-500 dark:text-blue-300" },
      { key: "general_business_state", label: "State / Division", placeholder: "Dhaka", hint: "State, division or province of your registered address.", icon: MapPin, iconColor: "text-red-500 dark:text-red-300" },
      { key: "general_business_postal_code", label: "Postal Code", placeholder: "1207", hint: "ZIP / postal code of your registered address.", icon: MapPin, iconColor: "text-orange-500 dark:text-orange-300" },
      { key: "general_vat_tin_bin", label: "VAT / TIN / BIN Number", placeholder: "123456789-0000", hint: "Tax identification number shown on invoices where required.", icon: IdentificationBadge, iconColor: "text-purple-500 dark:text-purple-300" },
      { key: "general_registration_certificate_url", label: "Registration Certificate", placeholder: "https://cdn.example.com/trade-license.pdf", hint: "Trade licence, registration certificate or sales tax permit file.", icon: FileText, iconColor: "text-slate-500 dark:text-slate-300", isDocument: true },
    ],
  },
  {
    id: "course_buttons",
    title: "Course Buttons",
    description: "Enroll & continue button labels",
    icon: ShoppingCart,
    color: { bg: "bg-indigo-100", text: "text-indigo-600", darkBg: "dark:bg-indigo-500/10", darkText: "dark:text-indigo-300" },
    fields: [
      { key: "general_cta_enroll", label: "Enroll Button Text", placeholder: "Enroll Now", hint: "Course page purchase button for paid courses. Leave blank for default “Enroll Now”.", icon: ShoppingCart, iconColor: "text-brand-600 dark:text-brand-400" },
      { key: "general_cta_enroll_free", label: "Free Enroll Button Text", placeholder: "Enroll for Free", hint: "Course page button when the course is free. Leave blank for default “Enroll for Free”.", icon: ShoppingCart, iconColor: "text-green-600 dark:text-green-300" },
      { key: "general_cta_continue", label: "Continue Learning Button Text", placeholder: "Continue Learning", hint: "Course page button shown when the user is already enrolled. Leave blank for default “Continue Learning”.", icon: ShoppingCart, iconColor: "text-blue-600 dark:text-blue-300" },
    ],
  },
  {
    id: "dashboard_buttons",
    title: "Dashboard Buttons",
    description: "“My Courses” button labels",
    icon: PlayCircle,
    color: { bg: "bg-blue-100", text: "text-blue-600", darkBg: "dark:bg-blue-500/10", darkText: "dark:text-blue-300" },
    fields: [
      { key: "general_dash_go_to_class", label: "Go to Class Text", placeholder: "Go to Class", hint: "“My Courses” dashboard button for live courses. Leave blank for default “Go to Class”.", icon: PlayCircle, iconColor: "text-green-600 dark:text-green-300" },
      { key: "general_dash_start_learning", label: "Start Learning Text", placeholder: "Start Learning", hint: "“My Courses” button for a recorded course not started yet. Leave blank for default “Start Learning”.", icon: PlayCircle, iconColor: "text-brand-600 dark:text-brand-400" },
      { key: "general_dash_continue", label: "Continue Text", placeholder: "Continue", hint: "“My Courses” button for a recorded course in progress. Leave blank for default “Continue”.", icon: PlayCircle, iconColor: "text-amber-600 dark:text-amber-300" },
      { key: "general_dash_review", label: "Review Text", placeholder: "Review", hint: "“My Courses” button for a completed recorded course. Leave blank for default “Review”.", icon: PlayCircle, iconColor: "text-blue-600 dark:text-blue-300" },
    ],
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Admin dashboard accent color",
    icon: Palette,
    color: { bg: "bg-purple-100", text: "text-purple-600", darkBg: "dark:bg-purple-500/10", darkText: "dark:text-purple-300" },
    fields: [
      { key: "general_admin_accent_color", label: "Accent Color", placeholder: "#a64dff", hint: "Recolors buttons, badges, and highlights across the admin dashboard only — the student-facing website is unaffected.", icon: Palette, iconColor: "text-purple-600 dark:text-purple-300", isColor: true },
    ],
  },
  {
    id: "localization",
    title: "Localization",
    description: "Timezone & date/time display format",
    icon: Clock,
    color: { bg: "bg-teal-100", text: "text-teal-600", darkBg: "dark:bg-teal-500/10", darkText: "dark:text-teal-300" },
    fields: [
      {
        key: "general_timezone", label: "Timezone", placeholder: "Asia/Dhaka",
        hint: "Timezone used to display dates and times throughout the admin dashboard.",
        icon: Clock, iconColor: "text-teal-600 dark:text-teal-300",
        options: [
          { value: "Asia/Dhaka", label: "Asia/Dhaka (GMT+6)" },
          { value: "UTC", label: "UTC (GMT+0)" },
          { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
          { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
          { value: "Europe/London", label: "Europe/London (GMT+0/+1)" },
          { value: "America/New_York", label: "America/New York (GMT-5/-4)" },
          { value: "America/Los_Angeles", label: "America/Los Angeles (GMT-8/-7)" },
        ],
      },
      {
        key: "general_date_format", label: "Date Format", placeholder: "",
        hint: "How dates are written across the admin dashboard.",
        icon: Clock, iconColor: "text-teal-600 dark:text-teal-300",
        options: [
          { value: "dd_mmm_yyyy", label: "05 Jan 2026" },
          { value: "dd_mm_yyyy", label: "05/01/2026" },
          { value: "mm_dd_yyyy", label: "01/05/2026" },
          { value: "yyyy_mm_dd", label: "2026-01-05" },
        ],
      },
      {
        key: "general_time_format", label: "Time Format", placeholder: "",
        hint: "12-hour (2:30 PM) or 24-hour (14:30) clock.",
        icon: Clock, iconColor: "text-teal-600 dark:text-teal-300",
        options: [
          { value: "12h", label: "12-hour (2:30 PM)" },
          { value: "24h", label: "24-hour (14:30)" },
        ],
      },
    ],
  },
  {
    id: "fonts",
    title: "Fonts",
    description: "English & Bangla font selection",
    icon: TextAa,
    color: { bg: "bg-rose-100", text: "text-rose-600", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-300" },
    fields: [
      {
        key: "general_english_font", label: "English Font", placeholder: "Poppins",
        hint: "Primary font for English text across the website and admin dashboard.",
        icon: TextAa, iconColor: "text-rose-600 dark:text-rose-300",
        options: ENGLISH_FONTS,
      },
      {
        key: "general_bangla_font", label: "Bangla Font", placeholder: "Hind Siliguri",
        hint: "Primary font for Bangla / Bengali text across the website and admin dashboard.",
        icon: TextAa, iconColor: "text-rose-500 dark:text-rose-300",
        options: BANGLA_FONTS,
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initial: Record<string, string>;
}

export function GeneralSettingsForm({ initial }: Props) {
  const [values, setValues] = useState<GeneralSettings>(() => {
    const out = { ...GENERAL_DEFAULTS };
    for (const key of Object.keys(GENERAL_DEFAULTS) as GeneralSettingsKey[]) {
      if (initial[key] !== undefined) out[key] = initial[key]!;
    }
    return out;
  });
  const [openId, setOpenId] = useState<string | null>(null);

  const openCategory = CATEGORIES.find((c) => c.id === openId) ?? null;

  function handleSaved(updated: Partial<GeneralSettings>) {
    setValues((p) => ({ ...p, ...updated }));
  }

  return (
    <div className="space-y-5">
      {/* Category tiles */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((cat, idx) => {
          const setCount = cat.fields.filter((f) => values[f.key]?.trim()).length;
          const isComplete = setCount === cat.fields.length;
          const percent = Math.round((setCount / cat.fields.length) * 100);
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.03, ease: "easeOut" }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOpenId(cat.id)}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-transparent hover:shadow-xl hover:shadow-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/40"
            >
              {/* Accent bar */}
              <span
                className={`absolute inset-x-0 top-0 h-1 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${cat.color.text} ${cat.color.darkText} bg-current`}
              />

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10 ${cat.color.bg} ${cat.color.text} ${cat.color.darkBg} ${cat.color.darkText}`}
                >
                  <Icon size={22} weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                </div>
                <CaretRight
                  size={14}
                  weight="bold"
                  className="shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600 dark:group-hover:text-brand-400"
                />
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? "bg-green-500 dark:bg-green-400" : "bg-brand-500 dark:bg-brand-400"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    {isComplete && <CheckCircle size={11} weight="fill" className="text-green-500 dark:text-green-400" />}
                    {setCount}/{cat.fields.length} fields
                  </span>
                  <span>{percent}%</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {openCategory && (
        <CategoryModal
          category={openCategory}
          values={values}
          onClose={() => setOpenId(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Per-category edit modal ──────────────────────────────────────────────────

function CategoryModal({
  category,
  values,
  onClose,
  onSaved,
}: {
  category: Category;
  values: GeneralSettings;
  onClose: () => void;
  onSaved: (updated: Partial<GeneralSettings>) => void;
}) {
  // Local draft so Cancel discards; only this category's keys are persisted.
  const original = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of category.fields) out[f.key] = values[f.key] ?? "";
    return out;
  }, [category, values]);

  const [draft, setDraft] = useState<Record<string, string>>(original);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(
    () => category.fields.some((f) => (draft[f.key] ?? "") !== (original[f.key] ?? "")),
    [draft, original, category.fields],
  );

  const set = (key: string, v: string) => setDraft((p) => ({ ...p, [key]: v }));

  function handleClose() {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    onClose();
  }

  function handleSave() {
    if (!isDirty) { onClose(); return; }
    startTransition(async () => {
      const payload: Partial<GeneralSettings> = {};
      for (const f of category.fields) payload[f.key] = (draft[f.key] ?? "").trim();
      const res = await updateGeneralSettingsAction(payload);
      if (res.success) {
        onSaved(payload);
        toast.success(`${category.title} saved`);
        onClose();
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  const Icon = category.icon;

  return (
    <div
      className="modal-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm dark:bg-black/60 sm:p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel-in flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${category.color.bg} ${category.color.text} ${category.color.darkBg} ${category.color.darkText}`}>
            <Icon size={19} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-bold text-gray-900 dark:text-white">{category.title}</h2>
              {isDirty && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{category.description}</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            {category.fields.map((f, idx) => {
              const Fi = f.icon;
              const val = draft[f.key] ?? "";
              const isWide = f.isImage || f.isDocument || f.isColor || f.wide;
              return (
                <div
                  key={f.key}
                  style={{ animationDelay: `${Math.min(idx, 8) * 25}ms` }}
                  className={`list-item-in ${isWide ? "sm:col-span-2" : ""}`}
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{f.label}</label>
                    {val.trim() && <CheckCircle size={13} weight="fill" className="shrink-0 text-green-500 dark:text-green-400" />}
                  </div>

                  {f.isImage || f.isDocument ? (
                    <ImagePickerField
                      value={val}
                      onChange={(v) => set(f.key, v)}
                      placeholder={f.placeholder}
                      disabled={isPending}
                      filterType={f.isDocument ? "document" : "image"}
                      previewClassName="mt-2 h-12 w-32 rounded-lg border border-gray-100 bg-gray-50 object-contain dark:border-slate-700 dark:bg-slate-800"
                    />
                  ) : f.isColor ? (
                    <div className="flex items-center gap-2">
                      <label className="relative shrink-0 cursor-pointer">
                        <input
                          type="color"
                          value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) ? val : "#a64dff"}
                          onChange={(e) => set(f.key, e.target.value)}
                          disabled={isPending}
                          className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700"
                        />
                      </label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        disabled={isPending}
                        spellCheck={false}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40"
                      />
                    </div>
                  ) : f.options ? (
                    <div className="relative">
                      <Fi size={15} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${f.iconColor}`} />
                      <select
                        value={val}
                        onChange={(e) => set(f.key, e.target.value)}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40"
                      >
                        {f.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="relative">
                      <Fi size={15} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${f.iconColor}`} />
                      <input
                        type={f.type ?? "text"}
                        value={val}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        disabled={isPending}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:bg-slate-800 dark:focus:ring-brand-900/40"
                      />
                    </div>
                  )}
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">{f.hint}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            onClick={handleClose}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:bg-slate-800 sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
          >
            {isPending ? <SpinnerGap size={15} className="animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
            {isPending ? "Saving…" : isDirty ? "Save Changes" : "No changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
