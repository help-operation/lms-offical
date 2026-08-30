"use client";

import { Plus, X, ImageIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import { ImagePickerField } from "@/shared/components/ImagePickerField";

// ─── Accordion panel ──────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; chevron: string }> = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   chevron: "text-blue-400"   },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  chevron: "text-green-400"  },
  purple: { bg: "bg-brand-50", border: "border-brand-200", text: "text-brand-700", chevron: "text-brand-400" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  chevron: "text-amber-400"  },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", chevron: "text-orange-400" },
  pink:   { bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-700",   chevron: "text-pink-400"   },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   chevron: "text-teal-400"   },
  rose:   { bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-700",   chevron: "text-rose-400"   },
  sky:    { bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700",    chevron: "text-sky-400"    },
  red:    { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    chevron: "text-red-400"    },
  gray:   { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700",   chevron: "text-gray-400"   },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", chevron: "text-indigo-400" },
};

function CollapsiblePanel({
  title, color = "gray", children, defaultOpen = false,
}: {
  title: string;
  color?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const c = COLOR_MAP[color] ?? COLOR_MAP.gray!;

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left`}
      >
        <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{title}</span>
        <ChevronDown
          size={15}
          className={`${c.chevron} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-dashed border-opacity-50 pt-3"
          style={{ borderColor: "inherit" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TextField({
  label, value, onChange, multiline = false,
}: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
        {label.replace(/_/g, " ")}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )}
    </div>
  );
}

function NumberField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
        {label.replace(/_/g, " ")}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}

function ColorField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded border border-gray-200 p-0.5"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}

function StringListEditor({
  label, items, onChange, placeholder,
}: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</p>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={it}
            onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700">
        <Plus size={13} /> Add
      </button>
    </div>
  );
}

// ─── Per-type editors ─────────────────────────────────────────────────────────

// HOME — Hero
function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const arr = (k: string): string[] => Array.isArray(content[k]) ? (content[k] as string[]) : [];
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Text Content" color="blue">
        <TextField label="Badge Text" value={s("badge")} onChange={(v) => set("badge", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Call to Action" color="green">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Primary CTA" value={s("primary_cta")} onChange={(v) => set("primary_cta", v)} />
          <TextField label="Primary CTA Link" value={s("primary_cta_link")} onChange={(v) => set("primary_cta_link", v)} />
          <TextField label="Secondary CTA" value={s("secondary_cta")} onChange={(v) => set("secondary_cta", v)} />
          <TextField label="Secondary CTA Link" value={s("secondary_cta_link")} onChange={(v) => set("secondary_cta_link", v)} />
        </div>
        <TextField label="Demo Video URL" value={s("demo_video_url")} onChange={(v) => set("demo_video_url", v)} />
        <p className="text-xs text-gray-400">If set, the Secondary CTA opens a video modal instead of navigating. Supports YouTube URLs.</p>
      </CollapsiblePanel>
      <CollapsiblePanel title="Social Proof" color="purple">
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Rating" value={s("rating")} onChange={(v) => set("rating", v)} />
          <TextField label="Review Count" value={s("review_count")} onChange={(v) => set("review_count", v)} />
          <TextField label="Student Count" value={s("student_count")} onChange={(v) => set("student_count", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Popular Tags" color="orange">
        {arr("popular_tags").map((tag, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={tag}
              onChange={(e) => {
                const tags = [...arr("popular_tags")];
                tags[i] = e.target.value;
                set("popular_tags", tags);
              }}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button onClick={() => set("popular_tags", arr("popular_tags").filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
        <button onClick={() => set("popular_tags", [...arr("popular_tags"), ""])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700">
          <Plus size={13} /> Add Tag
        </button>
      </CollapsiblePanel>
      <CollapsiblePanel title="Hero Image" color="pink">
        <ImagePickerField value={s("hero_image")} onChange={(v) => set("hero_image", v)} label="Image URL" previewClassName="w-20 h-20 rounded-full object-cover border-2 border-pink-200 mt-1" />
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — Hero (Green / ESkills template)
function HeroV2Editor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const sliderEnabled = !!content.slider_enabled;
  const heroImages: string[] = Array.isArray(content.hero_images) ? (content.hero_images as string[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Text Content" color="green">
        <TextField label="Title Line 1" value={s("title_line1")} onChange={(v) => set("title_line1", v)} />
        <TextField label="Title Line 2 (highlighted)" value={s("title_line2")} onChange={(v) => set("title_line2", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Call to Action" color="blue">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Primary CTA" value={s("primary_cta")} onChange={(v) => set("primary_cta", v)} />
          <TextField label="Primary CTA Link" value={s("primary_cta_link")} onChange={(v) => set("primary_cta_link", v)} />
          <TextField label="Secondary CTA" value={s("secondary_cta")} onChange={(v) => set("secondary_cta", v)} />
          <TextField label="Secondary CTA Link" value={s("secondary_cta_link")} onChange={(v) => set("secondary_cta_link", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Search Bar" color="teal">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Search Placeholder" value={s("search_placeholder")} onChange={(v) => set("search_placeholder", v)} />
          <TextField label="Category Placeholder" value={s("category_placeholder")} onChange={(v) => set("category_placeholder", v)} />
        </div>
        <TextField label="Search Link" value={s("search_link")} onChange={(v) => set("search_link", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Floating Stats" color="purple">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Top Stat Value" value={s("stat_top_value")} onChange={(v) => set("stat_top_value", v)} />
          <TextField label="Top Stat Label" value={s("stat_top_label")} onChange={(v) => set("stat_top_label", v)} />
          <TextField label="Bottom Stat Value" value={s("stat_bottom_value")} onChange={(v) => set("stat_bottom_value", v)} />
          <TextField label="Bottom Stat Label" value={s("stat_bottom_label")} onChange={(v) => set("stat_bottom_label", v)} />
          <TextField label="Instructors Count" value={s("instructors_count")} onChange={(v) => set("instructors_count", v)} />
          <TextField label="Instructors Label" value={s("instructors_label")} onChange={(v) => set("instructors_label", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Hero Image" color="pink">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sliderEnabled}
            onChange={(e) => set("slider_enabled", e.target.checked)}
            className="h-4 w-4 rounded accent-pink-600"
          />
          <span className="text-sm font-medium text-gray-700">Enable image slider (rotate through multiple images)</span>
        </label>
        {sliderEnabled ? (
          <div className="space-y-2 pt-1">
            {heroImages.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <ImagePickerField value={img} onChange={(v) => { const ni = [...heroImages]; ni[i] = v; set("hero_images", ni); }} label={`Image ${i + 1}`} previewClassName="w-20 h-24 rounded-2xl object-cover border-2 border-pink-200 mt-1" />
                <button onClick={() => set("hero_images", heroImages.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 mt-5"><X size={14} /></button>
              </div>
            ))}
            <button onClick={() => set("hero_images", [...heroImages, ""])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Image</button>
            <p className="text-xs text-gray-400">Add 2 or more images to rotate through them automatically.</p>
          </div>
        ) : (
          <div className="pt-1">
            <ImagePickerField value={s("hero_image")} onChange={(v) => set("hero_image", v)} label="Image URL" previewClassName="w-20 h-24 rounded-2xl object-cover border-2 border-pink-200 mt-1" />
          </div>
        )}
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — Feature Cards row
function FeatureCardsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Item = { icon: string; title: string; desc: string; link: string };
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const items: Item[] = Array.isArray(content.items) ? (content.items as Item[]) : [];
  const ICONS = ["instructor", "support", "access", "anywhere"];

  return (
    <CollapsiblePanel defaultOpen title="Feature Cards" color="purple">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
          <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
          <div className="grid grid-cols-2 gap-3 pr-5">
            <TextField label="Title" value={item.title} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, title: v }; set("items", ni); }} />
            <TextField label="Link" value={item.link} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, link: v }; set("items", ni); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
            <select value={item.icon} onChange={(e) => { const ni = [...items]; ni[i] = { ...item, icon: e.target.value }; set("items", ni); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </div>
          <TextField label="Description" value={item.desc} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, desc: v }; set("items", ni); }} multiline />
        </div>
      ))}
      <button onClick={() => set("items", [...items, { icon: "instructor", title: "", desc: "", link: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Card</button>
    </CollapsiblePanel>
  );
}

// HOME v4 — Categories Grid
function CategoriesGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Item = { title: string; course_count: string; image: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const items: Item[] = Array.isArray(content.items) ? (content.items as Item[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="CTA Label" value={s("cta_label")} onChange={(v) => set("cta_label", v)} />
          <TextField label="CTA Link" value={s("cta_link")} onChange={(v) => set("cta_link", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Categories" color="teal">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
            <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Title" value={item.title} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, title: v }; set("items", ni); }} />
              <TextField label="Course Count Text" value={item.course_count} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, course_count: v }; set("items", ni); }} />
            </div>
            <ImagePickerField value={item.image} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, image: v }; set("items", ni); }} label="Image URL" />
          </div>
        ))}
        <button onClick={() => set("items", [...items, { title: "", course_count: "", image: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Category</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — CTA Banner
function CtaBannerEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <CollapsiblePanel defaultOpen title="CTA Banner" color="green">
      <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
      <TextField label="Title Line 1" value={s("title_line1")} onChange={(v) => set("title_line1", v)} />
      <TextField label="Title Line 2" value={s("title_line2")} onChange={(v) => set("title_line2", v)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="CTA Label" value={s("cta_label")} onChange={(v) => set("cta_label", v)} />
        <TextField label="CTA Link" value={s("cta_link")} onChange={(v) => set("cta_link", v)} />
      </div>
    </CollapsiblePanel>
  );
}

// HOME v4 — Newly Launched Courses collage + stats
function FeaturedCollageEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Stat = { label: string; value: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const images: string[] = Array.isArray(content.images) ? (content.images as string[]) : [];
  const stats: Stat[] = Array.isArray(content.stats) ? (content.stats as Stat[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Collage Images" color="pink">
        {images.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <ImagePickerField value={img} onChange={(v) => { const ni = [...images]; ni[i] = v; set("images", ni); }} label={`Image ${i + 1}`} />
            <button onClick={() => set("images", images.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 mt-5"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => set("images", [...images, ""])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Image</button>
      </CollapsiblePanel>
      <CollapsiblePanel title="Stats Row" color="amber">
        {stats.map((stat, i) => (
          <div key={i} className="flex gap-2 items-end">
            <TextField label="Label" value={stat.label} onChange={(v) => { const ni = [...stats]; ni[i] = { ...stat, label: v }; set("stats", ni); }} />
            <TextField label="Value" value={stat.value} onChange={(v) => { const ni = [...stats]; ni[i] = { ...stat, value: v }; set("stats", ni); }} />
            <button onClick={() => set("stats", stats.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 mb-2"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => set("stats", [...stats, { label: "", value: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Stat</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — Best Selling Courses (header + filter tabs only; courses pulled live from API)
function CoursesGridV2Editor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const filters: string[] = Array.isArray(content.filters) ? (content.filters as string[]) : [];
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Courses are fetched live from the courses API — heading, filter labels, and see-all link are editable here.</p>
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="See-All Label" value={s("see_all_label")} onChange={(v) => set("see_all_label", v)} />
          <TextField label="See-All Link" value={s("see_all_link")} onChange={(v) => set("see_all_link", v)} />
        </div>
        <TextField label="Number of courses to show" value={s("limit")} onChange={(v) => set("limit", parseInt(v) || 6)} />
      </CollapsiblePanel>
      <div className="bg-teal-50 rounded-xl p-4">
        <StringListEditor label="Filter Tabs (decorative)" items={filters} onChange={(v) => set("filters", v)} placeholder="Category name" />
      </div>
    </div>
  );
}

// HOME v4 — Instructors grid (header only; instructors pulled live from API)
function InstructorsGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Instructors are fetched live from the Instructors list — only the heading is editable here.</p>
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Number to show" value={s("limit")} onChange={(v) => set("limit", parseInt(v) || 3)} />
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — Student Stories (header only; reviews pulled live from featured reviews)
function StudentStoriesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Stories are fetched live from Featured Reviews — only the heading is editable here.</p>
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title Prefix" value={s("title_prefix")} onChange={(v) => set("title_prefix", v)} />
        <TextField label="Title Highlight" value={s("title_highlight")} onChange={(v) => set("title_highlight", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
        <TextField label="Number to show" value={s("limit")} onChange={(v) => set("limit", parseInt(v) || 2)} />
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — Articles (header only; posts pulled live from Blog)
function ArticlesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Articles are fetched live from the Blog — only the heading is editable here.</p>
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Number to show" value={s("limit")} onChange={(v) => set("limit", parseInt(v) || 3)} />
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — FAQ Accordion
function FaqAccordionEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Item = { q: string; a: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const items: Item[] = Array.isArray(content.items) ? (content.items as Item[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="CTA Label" value={s("cta_label")} onChange={(v) => set("cta_label", v)} />
          <TextField label="CTA Link" value={s("cta_link")} onChange={(v) => set("cta_link", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Questions" color="indigo">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
            <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <TextField label="Question" value={item.q} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, q: v }; set("items", ni); }} />
            <TextField label="Answer" value={item.a} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, a: v }; set("items", ni); }} multiline />
          </div>
        ))}
        <button onClick={() => set("items", [...items, { q: "", a: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Question</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME v4 — Newsletter banner
function NewsletterEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <CollapsiblePanel defaultOpen title="Newsletter" color="green">
      <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Input Placeholder" value={s("placeholder")} onChange={(v) => set("placeholder", v)} />
        <TextField label="Button Label" value={s("cta_label")} onChange={(v) => set("cta_label", v)} />
      </div>
      <p className="text-xs text-gray-400">This form is presentational only — no email is stored or sent yet.</p>
    </CollapsiblePanel>
  );
}

// HOME / ABOUT — CTA (reused)
function CTAEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Text Content" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Buttons" color="green">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Primary CTA" value={s("primary_cta")} onChange={(v) => set("primary_cta", v)} />
          <TextField label="Primary CTA Link" value={s("primary_cta_link")} onChange={(v) => set("primary_cta_link", v)} />
          <TextField label="Secondary CTA" value={s("secondary_cta")} onChange={(v) => set("secondary_cta", v)} />
          <TextField label="Secondary CTA Link" value={s("secondary_cta_link")} onChange={(v) => set("secondary_cta_link", v)} />
        </div>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Partners
type BrandItem = { name: string; image: string };

function PartnersEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });

  const rawBrands = Array.isArray(content.brands) ? content.brands : [];
  const brands: BrandItem[] = rawBrands.map((b) =>
    typeof b === "string" ? { name: b, image: "" } : (b as BrandItem),
  );

  const [mediaOpenIdx, setMediaOpenIdx] = useState<number | null>(null);

  function setBrand(i: number, patch: Partial<BrandItem>) {
    const next = brands.map((b, j) => (j === i ? { ...b, ...patch } : b));
    set("brands", next);
  }

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Brand Names</p>

        {brands.map((brand, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Image preview / picker — fixed 120×48 boundary */}
            <button
              type="button"
              onClick={() => setMediaOpenIdx(i)}
              className="shrink-0 flex items-center justify-center w-[120px] h-[48px] rounded-lg border border-dashed border-gray-300 bg-white hover:border-brand-400 overflow-hidden transition-colors"
              title="Pick logo image"
            >
              {brand.image ? (
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon size={18} className="text-gray-300" />
              )}
            </button>

            {/* Name input */}
            <input
              value={brand.name}
              onChange={(e) => setBrand(i, { name: e.target.value })}
              placeholder="Brand name"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <button
              onClick={() => set("brands", brands.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={() => set("brands", [...brands, { name: "", image: "" }])}
          className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {mediaOpenIdx !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => {
            setBrand(mediaOpenIdx, { image: file.url });
            setMediaOpenIdx(null);
          }}
          onClose={() => setMediaOpenIdx(null)}
        />
      )}
    </div>
  );
}

// HOME — Flexible Learning / Features
function FlexibleLearningEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const stats: { value: string; label: string }[] = Array.isArray(content.stats) ? (content.stats as { value: string; label: string }[]) : [];
  const features: { title: string; desc: string }[] = Array.isArray(content.features) ? (content.features as { title: string; desc: string }[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Text" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
        <ImagePickerField value={s("image")} onChange={(v) => set("image", v)} label="Image URL" />
      </CollapsiblePanel>
      <CollapsiblePanel title="Stats" color="purple">
        {stats.map((st, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 items-center">
            <input value={st.value} onChange={(e) => { const ns = [...stats]; ns[i] = { ...st, value: e.target.value }; set("stats", ns); }} placeholder="Value" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <div className="flex gap-2">
              <input value={st.label} onChange={(e) => { const ns = [...stats]; ns[i] = { ...st, label: e.target.value }; set("stats", ns); }} placeholder="Label" className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button onClick={() => set("stats", stats.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
            </div>
          </div>
        ))}
        <button onClick={() => set("stats", [...stats, { value: "", label: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Stat</button>
      </CollapsiblePanel>
      {features.length > 0 && (
        <CollapsiblePanel title="Features (legacy)" color="green">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative">
              <button onClick={() => set("features", features.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
              <div className="space-y-2 pr-5">
                <input value={f.title} onChange={(e) => { const nf = [...features]; nf[i] = { ...f, title: e.target.value }; set("features", nf); }} placeholder="Feature title" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <textarea rows={2} value={f.desc} onChange={(e) => { const nf = [...features]; nf[i] = { ...f, desc: e.target.value }; set("features", nf); }} placeholder="Description" className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>
          ))}
        </CollapsiblePanel>
      )}
    </div>
  );
}

// HOME — Testimonials
function TestimonialsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Item = { name: string; role: string; image: string; rating: number; text: string; amount: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const items: Item[] = Array.isArray(content.items) ? (content.items as Item[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Testimonials" color="purple">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
            <button onClick={() => set("items", items.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Name" value={item.name} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, name: v }; set("items", ni); }} />
              <TextField label="Role / Company" value={item.role} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, role: v }; set("items", ni); }} />
              <TextField label="Amount / Price" value={item.amount} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, amount: v }; set("items", ni); }} />
              <TextField label="Rating (1-5)" value={String(item.rating)} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, rating: parseInt(v) || 5 }; set("items", ni); }} />
            </div>
            <TextField label="Testimonial Text" value={item.text} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, text: v }; set("items", ni); }} multiline />
            <ImagePickerField value={item.image} onChange={(v) => { const ni = [...items]; ni[i] = { ...item, image: v }; set("items", ni); }} label="Image URL" />
          </div>
        ))}
        <button onClick={() => set("items", [...items, { name: "", role: "", image: "", rating: 5, text: "", amount: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Testimonial</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Header-only editor (3-part split title + see-all link). Used for top_courses, recorded_courses, upcoming_batches (batches list edited separately).
function SplitTitleHeaderEditor({ content, onChange, headerColor = "blue" }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void; headerColor?: string }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className={`bg-${headerColor}-50 rounded-xl p-4 space-y-3`}>
      <p className={`text-xs font-bold text-${headerColor}-700 uppercase tracking-wider`}>Heading</p>
      <div className="grid grid-cols-3 gap-3">
        <TextField label="Prefix" value={s("title_prefix")} onChange={(v) => set("title_prefix", v)} />
        <TextField label="Highlight" value={s("title_highlight")} onChange={(v) => set("title_highlight", v)} />
        <TextField label="Suffix" value={s("title_suffix")} onChange={(v) => set("title_suffix", v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="See-All Label" value={s("see_all_label")} onChange={(v) => set("see_all_label", v)} />
        <TextField label="See-All Link" value={s("see_all_link")} onChange={(v) => set("see_all_link", v)} />
      </div>
    </div>
  );
}

// HOME — Top Courses (header only; courses pulled live from API)
function TopCoursesEditor(props: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Courses are fetched live from the courses API — only the heading & see-all link are editable here.</p>
      <SplitTitleHeaderEditor {...props} headerColor="blue" />
    </div>
  );
}

// HOME — Recorded Courses (header only; courses pulled live from API)
function RecordedCoursesEditor(props: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Recorded courses are fetched live from the courses API — only the heading & see-all link are editable here.</p>
      <SplitTitleHeaderEditor {...props} headerColor="blue" />
    </div>
  );
}

// HOME — Upcoming Batches
function UpcomingBatchesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const bool = (k: string, def: boolean) => (content[k] !== undefined ? !!content[k] : def);
  const str  = (k: string, def: string)  => (content[k] as string | undefined) ?? def;

  const showLive     = bool("show_live",     true);
  const showRecorded = bool("show_recorded", false);

  return (
    <div className="space-y-4">
      <SplitTitleHeaderEditor content={content} onChange={onChange} headerColor="blue" />

      {/* Live Courses toggle */}
      <CollapsiblePanel defaultOpen title="Live Courses" color="red">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLive}
            onChange={(e) => set("show_live", e.target.checked)}
            className="h-4 w-4 rounded accent-red-600"
          />
          <span className="text-sm font-medium text-gray-700">Show Live Courses in carousel</span>
        </label>
        {showLive && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <TextField
              label="Badge Label"
              value={str("live_badge_label", "Live Course")}
              onChange={(v) => set("live_badge_label", v)}
            />
            <ColorField
              label="Badge Color"
              value={str("live_badge_color", "#dc2626")}
              onChange={(v) => set("live_badge_color", v)}
            />
          </div>
        )}
        <p className="text-xs text-gray-400">
          Courses are fetched from published <strong>Live Courses</strong> — manage them in the sidebar.
        </p>
      </CollapsiblePanel>

      {/* Recorded Courses toggle */}
      <CollapsiblePanel defaultOpen title="Recorded Courses" color="purple">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showRecorded}
            onChange={(e) => set("show_recorded", e.target.checked)}
            className="h-4 w-4 rounded accent-brand-600"
          />
          <span className="text-sm font-medium text-gray-700">Show Recorded Courses in carousel</span>
        </label>
        {showRecorded && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <TextField
              label="Badge Label"
              value={str("recorded_badge_label", "Recorded")}
              onChange={(v) => set("recorded_badge_label", v)}
            />
            <ColorField
              label="Badge Color"
              value={str("recorded_badge_color", "#7c3aed")}
              onChange={(v) => set("recorded_badge_color", v)}
            />
          </div>
        )}
        <p className="text-xs text-gray-400">
          All published recorded courses will appear after live courses.
        </p>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Our Courses (header-only override; categories come from mock data for now)
function OurCoursesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Category data is fetched separately — only the optional section header is editable here. Leave blank to hide.</p>
      <CollapsiblePanel title="Optional Header" color="blue">
        <TextField label="Eyebrow" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Course Facilities Marquee
function CourseFacilitiesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const items: string[] = Array.isArray(content.items) ? (content.items as string[]) : [];
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Display" color="blue">
        <TextField label="Watermark Text (large faded background)" value={s("watermark")} onChange={(v) => set("watermark", v)} />
      </CollapsiblePanel>
      <div className="bg-green-50 rounded-xl p-4">
        <StringListEditor label="Marquee Items" items={items} onChange={(v) => set("items", v)} placeholder="Facility name" />
      </div>
    </div>
  );
}

// HOME — Get Started Steps
function GetStartedStepsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const steps: { title: string; icon?: string }[] = Array.isArray(content.steps) ? (content.steps as { title: string; icon?: string }[]) : [];
  const ICONS = ["pencil", "list", "play", "dashboard"];
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Image" color="blue">
        <ImagePickerField value={s("image")} onChange={(v) => set("image", v)} label="Image URL" />
      </CollapsiblePanel>
      <CollapsiblePanel title="Steps" color="green">
        {steps.map((st, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("steps", steps.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-[1fr_140px] gap-3 pr-5">
              <TextField label="Step Title" value={st.title} onChange={(v) => { const ns = [...steps]; ns[i] = { ...st, title: v }; set("steps", ns); }} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                <select
                  value={st.icon ?? "pencil"}
                  onChange={(e) => { const ns = [...steps]; ns[i] = { ...st, icon: e.target.value }; set("steps", ns); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => set("steps", [...steps, { title: "", icon: "pencil" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Step</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Featured In
type OutletItem = { name: string; image: string };

function FeaturedInEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });

  const rawOutlets = Array.isArray(content.outlets) ? content.outlets : [];
  const outlets: OutletItem[] = rawOutlets.map((o) =>
    typeof o === "string" ? { name: o, image: "" } : (o as OutletItem),
  );

  const [mediaOpenIdx, setMediaOpenIdx] = useState<number | null>(null);

  function setOutlet(i: number, patch: Partial<OutletItem>) {
    const next = outlets.map((o, j) => (j === i ? { ...o, ...patch } : o));
    set("outlets", next);
  }

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Prefix" value={s("title_prefix")} onChange={(v) => set("title_prefix", v)} />
          <TextField label="Highlight" value={s("title_highlight")} onChange={(v) => set("title_highlight", v)} />
          <TextField label="Suffix" value={s("title_suffix")} onChange={(v) => set("title_suffix", v)} />
        </div>
      </CollapsiblePanel>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Outlet Names</p>

        {outlets.map((outlet, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Image picker — fixed 120×48 boundary */}
            <button
              type="button"
              onClick={() => setMediaOpenIdx(i)}
              className="shrink-0 flex items-center justify-center w-[120px] h-[48px] rounded-lg border border-dashed border-gray-300 bg-white hover:border-brand-400 overflow-hidden transition-colors"
              title="Pick logo image"
            >
              {outlet.image ? (
                <img src={outlet.image} alt={outlet.name} className="w-full h-full object-contain" />
              ) : (
                <ImageIcon size={18} className="text-gray-300" />
              )}
            </button>

            <input
              value={outlet.name}
              onChange={(e) => setOutlet(i, { name: e.target.value })}
              placeholder="Outlet name"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => set("outlets", outlets.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={() => set("outlets", [...outlets, { name: "", image: "" }])}
          className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {mediaOpenIdx !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => { setOutlet(mediaOpenIdx, { image: file.url }); setMediaOpenIdx(null); }}
          onClose={() => setMediaOpenIdx(null)}
        />
      )}
    </div>
  );
}

// HOME — Student Reviews
function StudentReviewsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Review = { id: number; name: string; batch: string; rating: number; text: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const reviews: Review[] = Array.isArray(content.reviews) ? (content.reviews as Review[]) : [];
  const nextId = () => Math.max(0, ...reviews.map((r) => r.id)) + 1;

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="See-All Label" value={s("see_all_label")} onChange={(v) => set("see_all_label", v)} />
          <TextField label="See-All Link" value={s("see_all_link")} onChange={(v) => set("see_all_link", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Reviews" color="purple">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
            <button onClick={() => set("reviews", reviews.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-3 gap-3 pr-5">
              <TextField label="Name" value={r.name} onChange={(v) => { const nr = [...reviews]; nr[i] = { ...r, name: v }; set("reviews", nr); }} />
              <TextField label="Batch" value={r.batch} onChange={(v) => { const nr = [...reviews]; nr[i] = { ...r, batch: v }; set("reviews", nr); }} />
              <NumberField label="Rating (1-5)" value={r.rating} onChange={(v) => { const nr = [...reviews]; nr[i] = { ...r, rating: v }; set("reviews", nr); }} />
            </div>
            <TextField label="Review Text" value={r.text} onChange={(v) => { const nr = [...reviews]; nr[i] = { ...r, text: v }; set("reviews", nr); }} multiline />
          </div>
        ))}
        <button onClick={() => set("reviews", [...reviews, { id: nextId(), name: "", batch: "", rating: 5, text: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Review</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Success Stories
function SuccessStoriesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Title Prefix" value={s("title_prefix")} onChange={(v) => set("title_prefix", v)} />
          <TextField label="Title Highlight" value={s("title_highlight")} onChange={(v) => set("title_highlight", v)} />
        </div>
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="See-More Label" value={s("see_more_label")} onChange={(v) => set("see_more_label", v)} />
          <TextField label="See-More Link" value={s("see_more_link")} onChange={(v) => set("see_more_link", v)} />
        </div>
      </CollapsiblePanel>

      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 space-y-1">
        <p className="text-xs font-semibold text-amber-700">ℹ️ Stories &amp; filter tabs are auto-generated from <strong>Admin → Success Stories</strong>.</p>
        <p className="text-xs text-amber-600">Filter tabs are built from the unique categories you set on each story.</p>
      </div>
    </div>
  );
}

// HOME — Certificate Showcase
function CertificateEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Feature = { title: string; desc: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const features: Feature[] = Array.isArray(content.features) ? (content.features as Feature[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Certificate Image" color="green">
        <ImagePickerField
          value={s("certificate_image")}
          onChange={(v) => set("certificate_image", v)}
          hint="Upload your actual certificate image. If set, it replaces the default certificate design."
          previewClassName="w-full h-40 object-contain rounded-xl border border-gray-100 mt-2 bg-gray-50"
        />
      </CollapsiblePanel>
      <CollapsiblePanel title="Benefits (4 max recommended)" color="amber">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("features", features.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="pr-5 space-y-2">
              <TextField label="Title" value={f.title} onChange={(v) => { const nf = [...features]; nf[i] = { ...f, title: v }; set("features", nf); }} />
              <TextField label="Description" value={f.desc} onChange={(v) => { const nf = [...features]; nf[i] = { ...f, desc: v }; set("features", nf); }} multiline />
            </div>
          </div>
        ))}
        <button onClick={() => set("features", [...features, { title: "", desc: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Benefit</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Payment Methods
function PaymentMethodEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Method = { name: string; action: string; color?: string; image?: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const methods: Method[] = Array.isArray(content.methods) ? (content.methods as Method[]) : [];
  const COLORS = ["sky", "pink", "purple", "orange", "green", "gray"];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Methods" color="green">
        {methods.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("methods", methods.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-3 gap-3 pr-5">
              <TextField label="Name (fallback text)" value={m.name} onChange={(v) => { const nm = [...methods]; nm[i] = { ...m, name: v }; set("methods", nm); }} />
              <TextField label="Action (button label)" value={m.action} onChange={(v) => { const nm = [...methods]; nm[i] = { ...m, action: v }; set("methods", nm); }} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <select
                  value={m.color ?? "gray"}
                  onChange={(e) => { const nm = [...methods]; nm[i] = { ...m, color: e.target.value }; set("methods", nm); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <ImagePickerField
              value={m.image ?? ""}
              onChange={(v) => { const nm = [...methods]; nm[i] = { ...m, image: v }; set("methods", nm); }}
              label="Logo Image (replaces name text when set)"
              previewClassName="h-10 w-auto object-contain rounded border border-gray-100 mt-1"
            />
          </div>
        ))}
        <button onClick={() => set("methods", [...methods, { name: "", action: "", color: "gray", image: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Method</button>
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Join Instructor
function JoinInstructorEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Content" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="CTA Label" value={s("cta_label")} onChange={(v) => set("cta_label", v)} />
          <TextField label="CTA Link" value={s("cta_link")} onChange={(v) => set("cta_link", v)} />
        </div>
        <ImagePickerField value={s("image")} onChange={(v) => set("image", v)} label="Image URL" />
      </CollapsiblePanel>
    </div>
  );
}

// HOME — Community
function CommunityEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const avatars: string[] = Array.isArray(content.avatars) ? (content.avatars as string[]) : [];
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title (use line breaks for multi-line)" value={s("title")} onChange={(v) => set("title", v)} multiline />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Members Badge" color="green">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Members Label" value={s("members_label")} onChange={(v) => set("members_label", v)} />
          <TextField label="Members Count" value={s("members_count")} onChange={(v) => set("members_count", v)} />
        </div>
      </CollapsiblePanel>
      <div className="bg-pink-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Avatar Images (first 5 shown as map pins)</p>
        {avatars.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <ImagePickerField
              value={url}
              onChange={(v) => { const next = [...avatars]; next[i] = v; set("avatars", next); }}
              previewClassName="hidden"
            />
            <button onClick={() => set("avatars", avatars.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => set("avatars", [...avatars, ""])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700">
          <Plus size={13} /> Add Avatar
        </button>
      </div>
    </div>
  );
}

// FOOTER — Footer Info
function FooterInfoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Brand" color="teal">
        <TextField label="Site Name" value={s("site_name")} onChange={(v) => set("site_name", v)} />
        <TextField label="Description" value={s("description")} onChange={(v) => set("description", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Payment Strip Image" color="orange">
        <ImagePickerField
          value={s("payment_strip_image")}
          onChange={(v) => set("payment_strip_image", v)}
          hint="Upload a combined payment logos banner (e.g. Visa, bKash, Rocket etc). Shown in the footer bottom strip."
          previewClassName="w-full h-16 object-contain rounded-lg border border-gray-100 mt-1 bg-white"
        />
      </CollapsiblePanel>
    </div>
  );
}

// SHARED — Simple Hero (contact, about, faq hero)
function SimpleHeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <CollapsiblePanel title="Hero Content" color="sky">
      <TextField label="Eyebrow / Badge" value={s("eyebrow")} onChange={(v) => set("eyebrow", v)} />
      <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
    </CollapsiblePanel>
  );
}

// CONTACT — Contact Info
function ContactInfoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel title="Contact Details" color="sky" defaultOpen>
        <TextField label="Email" value={s("email")} onChange={(v) => set("email", v)} />
        <TextField label="Phone" value={s("phone")} onChange={(v) => set("phone", v)} />
        <TextField label="Address" value={s("address")} onChange={(v) => set("address", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Office Hours" color="blue">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Days (e.g. Sat – Thu)" value={s("hours_days")} onChange={(v) => set("hours_days", v)} />
          <TextField label="Time (e.g. 9AM – 6PM)" value={s("hours_time")} onChange={(v) => set("hours_time", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Contact Form Image" color="pink">
        <ImagePickerField
          value={s("contact_image")}
          onChange={(v) => set("contact_image", v)}
          hint="Image shown beside the contact form."
          previewClassName="w-full h-40 object-cover rounded-xl border border-gray-100 mt-2"
        />
      </CollapsiblePanel>
      <CollapsiblePanel title="Google Maps Embed" color="green">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Google Maps Embed URL or iframe code</label>
          <input
            value={s("map_embed_url")}
            onChange={(e) => {
              const val = e.target.value;
              // Auto-extract src from iframe if user pastes full embed code
              const match = val.match(/src=["']([^"']+)["']/);
              set("map_embed_url", match ? match[1] : val);
            }}
            placeholder='Paste URL or full <iframe ...> embed code'
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">You can paste either the URL or the full &lt;iframe&gt; embed code — the URL will be extracted automatically.</p>
        </div>
      </CollapsiblePanel>
    </div>
  );
}

// ABOUT — Stats
function AboutStatsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Stat = { value: string; label: string };
  const stats: Stat[] = Array.isArray(content.stats) ? (content.stats as Stat[]) : [];
  const set = (v: Stat[]) => onChange({ ...content, stats: v });
  return (
    <CollapsiblePanel title="Stats" color="indigo">
      {stats.map((st, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <input value={st.value} onChange={(e) => { const ns = [...stats]; ns[i] = { ...st, value: e.target.value }; set(ns); }} placeholder="Value e.g. 56K+" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <div className="flex gap-2">
            <input value={st.label} onChange={(e) => { const ns = [...stats]; ns[i] = { ...st, label: e.target.value }; set(ns); }} placeholder="Label e.g. Students" className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <button onClick={() => set(stats.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => set([...stats, { value: "", label: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Stat</button>
    </CollapsiblePanel>
  );
}

// ABOUT — Mission & Vision
function AboutMissionVisionEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Our Mission" color="pink">
        <TextField label="Mission Text" value={s("mission_text")} onChange={(v) => set("mission_text", v)} multiline />
      </CollapsiblePanel>
      <div className="bg-brand-50 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Our Vision</p>
        <TextField label="Vision Text" value={s("vision_text")} onChange={(v) => set("vision_text", v)} multiline />
      </div>
    </div>
  );
}

// ABOUT — Team
function AboutTeamEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Member = { name: string; role: string; desc: string; image: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const members: Member[] = Array.isArray(content.members) ? (content.members as Member[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Header" color="pink">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Team Members" color="rose">
        {members.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
            <button onClick={() => set("members", members.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Name" value={m.name} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, name: v }; set("members", nm); }} />
              <TextField label="Role / Title" value={m.role} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, role: v }; set("members", nm); }} />
            </div>
            <TextField label="Short Bio" value={m.desc} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, desc: v }; set("members", nm); }} multiline />
            <ImagePickerField value={m.image} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, image: v }; set("members", nm); }} label="Photo URL" />
            {m.image && <img src={m.image} alt={m.name} className="w-14 h-14 rounded-full object-cover border-2 border-pink-200" />}
          </div>
        ))}
        <button onClick={() => set("members", [...members, { name: "", role: "", desc: "", image: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Member</button>
      </CollapsiblePanel>
    </div>
  );
}

// ABOUT — Intro (long-form with subsections)
function AboutIntroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Sub = { title: string; paragraphs: string[] };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const subsections: Sub[] = Array.isArray(content.subsections) ? (content.subsections as Sub[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Intro Paragraph (with link)" color="green">
        <TextField label="Lead Text (before link)" value={s("intro_lead")} onChange={(v) => set("intro_lead", v)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Link Text" value={s("intro_link_text")} onChange={(v) => set("intro_link_text", v)} />
          <TextField label="Link URL" value={s("intro_link_url")} onChange={(v) => set("intro_link_url", v)} />
        </div>
        <TextField label="Second Paragraph" value={s("intro_paragraph")} onChange={(v) => set("intro_paragraph", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Subsections" color="purple">
        {subsections.map((sub, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("subsections", subsections.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="pr-5 space-y-2">
              <TextField label="Subsection Title" value={sub.title} onChange={(v) => { const ns = [...subsections]; ns[i] = { ...sub, title: v }; set("subsections", ns); }} />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Paragraphs</p>
                {(sub.paragraphs ?? []).map((p, pi) => (
                  <div key={pi} className="flex gap-2">
                    <textarea
                      rows={2}
                      value={p}
                      onChange={(e) => {
                        const ns = [...subsections];
                        const nps = [...(sub.paragraphs ?? [])];
                        nps[pi] = e.target.value;
                        ns[i] = { ...sub, paragraphs: nps };
                        set("subsections", ns);
                      }}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                    <button onClick={() => {
                      const ns = [...subsections];
                      const nps = (sub.paragraphs ?? []).filter((_, k) => k !== pi);
                      ns[i] = { ...sub, paragraphs: nps };
                      set("subsections", ns);
                    }} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
                <button onClick={() => {
                  const ns = [...subsections];
                  const nps = [...(sub.paragraphs ?? []), ""];
                  ns[i] = { ...sub, paragraphs: nps };
                  set("subsections", ns);
                }} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={12} /> Add Paragraph</button>
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => set("subsections", [...subsections, { title: "", paragraphs: [""] }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Subsection</button>
      </CollapsiblePanel>
    </div>
  );
}

// ABOUT — Founding Team (simpler than about_team: no `desc`)
function FoundingTeamEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Member = { name: string; role: string; image: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const members: Member[] = Array.isArray(content.members) ? (content.members as Member[]) : [];
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Members" color="rose">
        {members.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("members", members.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Name" value={m.name} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, name: v }; set("members", nm); }} />
              <TextField label="Role / Title" value={m.role} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, role: v }; set("members", nm); }} />
            </div>
            <ImagePickerField value={m.image} onChange={(v) => { const nm = [...members]; nm[i] = { ...m, image: v }; set("members", nm); }} label="Photo URL" />
            {m.image && <img src={m.image} alt={m.name} className="w-20 h-14 object-cover rounded-lg border-2 border-rose-200" />}
          </div>
        ))}
        <button onClick={() => set("members", [...members, { name: "", role: "", image: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Member</button>
      </CollapsiblePanel>
    </div>
  );
}

// ABOUT — Why Choose Us (3-column reasons grid)
function WhyIctEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Reason = { title: string; desc: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const reasons: Reason[] = Array.isArray(content.reasons) ? (content.reasons as Reason[]) : [];
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Reasons" color="green">
        {reasons.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("reasons", reasons.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="pr-5 space-y-2">
              <TextField label="Title" value={r.title} onChange={(v) => { const nr = [...reasons]; nr[i] = { ...r, title: v }; set("reasons", nr); }} />
              <TextField label="Description" value={r.desc} onChange={(v) => { const nr = [...reasons]; nr[i] = { ...r, desc: v }; set("reasons", nr); }} multiline />
            </div>
          </div>
        ))}
        <button onClick={() => set("reasons", [...reasons, { title: "", desc: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Reason</button>
      </CollapsiblePanel>
    </div>
  );
}

// ABOUT — In the Media (press articles grid)
function MediaEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Article = { id: number; outlet: string; date: string; image: string; title: string; link?: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const articles: Article[] = Array.isArray(content.articles) ? (content.articles as Article[]) : [];
  const nextId = () => Math.max(0, ...articles.map((a) => a.id)) + 1;
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Articles" color="purple">
        {articles.map((a, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("articles", articles.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Outlet" value={a.outlet} onChange={(v) => { const na = [...articles]; na[i] = { ...a, outlet: v }; set("articles", na); }} />
              <TextField label="Date" value={a.date} onChange={(v) => { const na = [...articles]; na[i] = { ...a, date: v }; set("articles", na); }} />
            </div>
            <TextField label="Title" value={a.title} onChange={(v) => { const na = [...articles]; na[i] = { ...a, title: v }; set("articles", na); }} />
            <ImagePickerField value={a.image} onChange={(v) => { const na = [...articles]; na[i] = { ...a, image: v }; set("articles", na); }} label="Image URL" />
            <TextField label="Read-more Link" value={a.link ?? ""} onChange={(v) => { const na = [...articles]; na[i] = { ...a, link: v }; set("articles", na); }} />
          </div>
        ))}
        <button onClick={() => set("articles", [...articles, { id: nextId(), outlet: "", date: "", image: "", title: "", link: "/blog" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Article</button>
      </CollapsiblePanel>
    </div>
  );
}

// ABOUT — Milestones (alternating timeline)
function MilestonesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type M = { date: string; desc: string };
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const milestones: M[] = Array.isArray(content.milestones) ? (content.milestones as M[]) : [];
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Heading" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
        <TextField label="Subtitle" value={s("subtitle")} onChange={(v) => set("subtitle", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Milestones (alternating left/right)" color="green">
        {milestones.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("milestones", milestones.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="pr-5 space-y-2">
              <TextField label="Date" value={m.date} onChange={(v) => { const nm = [...milestones]; nm[i] = { ...m, date: v }; set("milestones", nm); }} />
              <TextField label="Description" value={m.desc} onChange={(v) => { const nm = [...milestones]; nm[i] = { ...m, desc: v }; set("milestones", nm); }} multiline />
            </div>
          </div>
        ))}
        <button onClick={() => set("milestones", [...milestones, { date: "", desc: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Milestone</button>
      </CollapsiblePanel>
    </div>
  );
}

// OUR-INSTRUCTOR — Mentor Grid
function MentorGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Mentor = { name: string; role: string; image: string };
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const mentors: Mentor[] = Array.isArray(content.mentors) ? (content.mentors as Mentor[]) : [];

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Mentors" color="rose">
        {mentors.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("mentors", mentors.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Name" value={m.name} onChange={(v) => { const nm = [...mentors]; nm[i] = { ...m, name: v }; set("mentors", nm); }} />
              <TextField label="Role / Title" value={m.role} onChange={(v) => { const nm = [...mentors]; nm[i] = { ...m, role: v }; set("mentors", nm); }} />
            </div>
            <ImagePickerField value={m.image} onChange={(v) => { const nm = [...mentors]; nm[i] = { ...m, image: v }; set("mentors", nm); }} label="Photo URL" />
            {m.image && <img src={m.image} alt={m.name} className="h-16 w-12 object-cover rounded-lg border-2 border-rose-200" />}
          </div>
        ))}
        <button onClick={() => set("mentors", [...mentors, { name: "", role: "", image: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Mentor</button>
      </CollapsiblePanel>
    </div>
  );
}

// SUCCESS-STORIES — full panel (text + video reviews with filters)
function SuccessStoriesPanelEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Filter = { key: string; label: string };
  type Video  = { id: number; title: string; category: string; categoryLabel: string; image: string };
  type Text   = { id: number; name: string; batch: string; category: string; rating: number; text: string };
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const pageSize = typeof content.page_size === "number" ? content.page_size : 6;
  const filters: Filter[] = Array.isArray(content.filters) ? (content.filters as Filter[]) : [];
  const videos:  Video[]  = Array.isArray(content.videos)  ? (content.videos  as Video[])  : [];
  const texts:   Text[]   = Array.isArray(content.texts)   ? (content.texts   as Text[])   : [];
  const nextVideoId = () => Math.max(0, ...videos.map((v) => v.id)) + 1;
  const nextTextId  = () => Math.max(0, ...texts.map((t) => t.id))  + 1;

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Pagination" color="blue">
        <NumberField label="Page Size (items per Load More)" value={pageSize} onChange={(v) => set("page_size", v)} />
      </CollapsiblePanel>

      <CollapsiblePanel title="Filter Tabs" color="amber">
        {filters.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
            <input value={f.key}   onChange={(e) => { const nf = [...filters]; nf[i] = { ...f, key: e.target.value };   set("filters", nf); }} placeholder="key (e.g. video)" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input value={f.label} onChange={(e) => { const nf = [...filters]; nf[i] = { ...f, label: e.target.value }; set("filters", nf); }} placeholder="label" className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <button onClick={() => set("filters", filters.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => set("filters", [...filters, { key: "", label: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Filter</button>
      </CollapsiblePanel>

      <CollapsiblePanel title="Video Reviews" color="purple">
        {videos.map((v, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("videos", videos.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-2 gap-3 pr-5">
              <TextField label="Title" value={v.title} onChange={(val) => { const nv = [...videos]; nv[i] = { ...v, title: val }; set("videos", nv); }} />
              <TextField label="Category (filter key)" value={v.category} onChange={(val) => { const nv = [...videos]; nv[i] = { ...v, category: val }; set("videos", nv); }} />
              <TextField label="Category Label" value={v.categoryLabel} onChange={(val) => { const nv = [...videos]; nv[i] = { ...v, categoryLabel: val }; set("videos", nv); }} />
            </div>
            <ImagePickerField value={v.image} onChange={(val) => { const nv = [...videos]; nv[i] = { ...v, image: val }; set("videos", nv); }} label="Image URL" />
          </div>
        ))}
        <button onClick={() => set("videos", [...videos, { id: nextVideoId(), title: "", category: "all", categoryLabel: "", image: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Video Review</button>
      </CollapsiblePanel>

      <div className="bg-emerald-50 rounded-xl p-4 space-y-4">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Text Reviews</p>
        {texts.map((t, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative space-y-2">
            <button onClick={() => set("texts", texts.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
            <div className="grid grid-cols-3 gap-3 pr-5">
              <TextField label="Name" value={t.name} onChange={(val) => { const nt = [...texts]; nt[i] = { ...t, name: val }; set("texts", nt); }} />
              <TextField label="Batch" value={t.batch} onChange={(val) => { const nt = [...texts]; nt[i] = { ...t, batch: val }; set("texts", nt); }} />
              <NumberField label="Rating (1-5)" value={t.rating} onChange={(val) => { const nt = [...texts]; nt[i] = { ...t, rating: val }; set("texts", nt); }} />
            </div>
            <TextField label="Category (filter key)" value={t.category} onChange={(val) => { const nt = [...texts]; nt[i] = { ...t, category: val }; set("texts", nt); }} />
            <TextField label="Review Text" value={t.text} onChange={(val) => { const nt = [...texts]; nt[i] = { ...t, text: val }; set("texts", nt); }} multiline />
          </div>
        ))}
        <button onClick={() => set("texts", [...texts, { id: nextTextId(), name: "", batch: "", category: "all", rating: 5, text: "" }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Text Review</button>
      </div>
    </div>
  );
}

// LIVE-CLASSES — Batches Grid (live/recorded mix with badges)
function BatchesGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Batch = { id: number; title: string; image: string; type: "live" | "recorded"; batch?: string; lessons: number; hours: number; reviews: number; students: number; price: number; oldPrice: number };
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  const batches: Batch[] = Array.isArray(content.batches) ? (content.batches as Batch[]) : [];
  const nextId = () => Math.max(0, ...batches.map((b) => b.id)) + 1;

  return (
    <CollapsiblePanel title="Batches" color="teal">
      {batches.map((b, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 relative space-y-3">
          <button onClick={() => set("batches", batches.filter((_, j) => j !== i))} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={13} /></button>
          <div className="grid grid-cols-2 gap-3 pr-5">
            <TextField label="Title" value={b.title} onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, title: v }; set("batches", nb); }} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={b.type}
                onChange={(e) => { const nb = [...batches]; nb[i] = { ...b, type: e.target.value as "live" | "recorded" }; set("batches", nb); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="live">Live</option>
                <option value="recorded">Recorded</option>
              </select>
            </div>
            <TextField label="Batch Label (e.g. 4th Batch)" value={b.batch ?? ""} onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, batch: v }; set("batches", nb); }} />
            <ImagePickerField value={b.image} onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, image: v }; set("batches", nb); }} label="Image URL" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <NumberField label="Lessons"  value={b.lessons}  onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, lessons: v };  set("batches", nb); }} />
            <NumberField label="Hours"    value={b.hours}    onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, hours: v };    set("batches", nb); }} />
            <NumberField label="Reviews"  value={b.reviews}  onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, reviews: v };  set("batches", nb); }} />
            <NumberField label="Students" value={b.students} onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, students: v }; set("batches", nb); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Price"     value={b.price}    onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, price: v };    set("batches", nb); }} />
            <NumberField label="Old Price" value={b.oldPrice} onChange={(v) => { const nb = [...batches]; nb[i] = { ...b, oldPrice: v }; set("batches", nb); }} />
          </div>
        </div>
      ))}
      <button onClick={() => set("batches", [...batches, { id: nextId(), title: "", image: "", type: "live", batch: "", lessons: 0, hours: 0, reviews: 0, students: 0, price: 0, oldPrice: 0 }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold"><Plus size={13} /> Add Batch</button>
    </CollapsiblePanel>
  );
}

// FREE-COURSES — Free Courses Grid (header-only; grid pulls real courses with price=0)
function FreeCoursesGridEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        Courses with price ৳0 are pulled live from the courses catalog —
        only the heading is editable here.
      </p>
      <SplitTitleHeaderEditor content={content} onChange={onChange} headerColor="blue" />
    </div>
  );
}

// FREE-COURSES — Coming Soon Card
function ComingSoonCardEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Main Message" color="blue">
        <TextField label="Headline" value={s("message")} onChange={(v) => set("message", v)} multiline />
      </CollapsiblePanel>
      <CollapsiblePanel title="Subtext (with inline link)" color="green">
        <TextField label="Lead Text (before link)" value={s("subtext_lead")} onChange={(v) => set("subtext_lead", v)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Link Text" value={s("subtext_link_text")} onChange={(v) => set("subtext_link_text", v)} />
          <TextField label="Link URL" value={s("subtext_link_url")} onChange={(v) => set("subtext_link_url", v)} />
        </div>
        <TextField label="Trail Text (after link, e.g. '.')" value={s("subtext_trail")} onChange={(v) => set("subtext_trail", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="CTA Button" color="purple">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="CTA Label" value={s("cta_label")} onChange={(v) => set("cta_label", v)} />
          <TextField label="CTA Link" value={s("cta_link")} onChange={(v) => set("cta_link", v)} />
        </div>
      </CollapsiblePanel>
    </div>
  );
}

// AUTH — Login Panel (title + side image)
function LoginPanelEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Text" color="blue">
        <TextField label="Title" value={s("title")} onChange={(v) => set("title", v)} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Side Image" color="pink">
        <ImagePickerField
          value={s("image")}
          onChange={(v) => set("image", v)}
          label="Image URL"
          hint="Displayed on the left side of the login form (desktop only)."
          previewClassName="w-full h-40 object-cover rounded-xl border border-gray-100 mt-2"
        />
      </CollapsiblePanel>
    </div>
  );
}

// FAQ PAGE — Main FAQ with categories
function FAQMainEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type QA = { q: string; a: string };
  type Cat = { id: string; title: string; questions: QA[] };
  const categories: Cat[] = Array.isArray(content.categories) ? (content.categories as Cat[]) : [];
  const set = (v: Cat[]) => onChange({ ...content, categories: v });

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Manage FAQ categories and their questions.</p>
      {categories.map((cat, ci) => (
        <div key={ci} className="bg-orange-50 rounded-xl border border-orange-100 p-4 space-y-3">
          {/* Category header */}
          <div className="flex items-center gap-3">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category ID</label>
                <input
                  value={cat.id}
                  onChange={(e) => { const nc = [...categories]; nc[ci] = { ...cat, id: e.target.value }; set(nc); }}
                  placeholder="e.g. general"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category Title</label>
                <input
                  value={cat.title}
                  onChange={(e) => { const nc = [...categories]; nc[ci] = { ...cat, title: e.target.value }; set(nc); }}
                  placeholder="e.g. General"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <button onClick={() => set(categories.filter((_, j) => j !== ci))} className="text-gray-400 hover:text-red-500 mt-4 shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Q&A pairs */}
          <div className="space-y-2 pl-2">
            {cat.questions.map((qa, qi) => (
              <div key={qi} className="bg-white rounded-lg border border-gray-100 p-3 relative space-y-2">
                <button onClick={() => { const nc = [...categories]; nc[ci] = { ...cat, questions: cat.questions.filter((_, k) => k !== qi) }; set(nc); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={12} /></button>
                <div className="pr-4 space-y-2">
                  <input
                    value={qa.q}
                    onChange={(e) => { const nc = [...categories]; const nq = [...cat.questions]; nq[qi] = { ...qa, q: e.target.value }; nc[ci] = { ...cat, questions: nq }; set(nc); }}
                    placeholder="Question"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <textarea
                    rows={2}
                    value={qa.a}
                    onChange={(e) => { const nc = [...categories]; const nq = [...cat.questions]; nq[qi] = { ...qa, a: e.target.value }; nc[ci] = { ...cat, questions: nq }; set(nc); }}
                    placeholder="Answer"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => { const nc = [...categories]; nc[ci] = { ...cat, questions: [...cat.questions, { q: "", a: "" }] }; set(nc); }}
              className="flex items-center gap-1 text-xs text-orange-600 font-semibold hover:text-orange-700"
            >
              <Plus size={12} /> Add Question
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => set([...categories, { id: "", title: "", questions: [] }])} className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:text-brand-700">
        <Plus size={13} /> Add Category
      </button>
    </div>
  );
}

// HOME — All Courses Grid
function AllCoursesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const s = (k: string) => (content[k] as string) ?? "";
  const n = (k: string) => typeof content[k] === "number" ? (content[k] as number) : 2;
  const set = (k: string, v: unknown) => onChange({ ...content, [k]: v });

  return (
    <div className="space-y-4">
      <CollapsiblePanel defaultOpen title="Section Header" color="blue">
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Title Prefix" value={s("title_prefix")} onChange={(v) => set("title_prefix", v)} />
          <TextField label="Title Highlight" value={s("title_highlight")} onChange={(v) => set("title_highlight", v)} />
          <TextField label="Title Suffix" value={s("title_suffix")} onChange={(v) => set("title_suffix", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="See All Label" value={s("see_all_label")} onChange={(v) => set("see_all_label", v)} />
          <TextField label="See All Link" value={s("see_all_link")} onChange={(v) => set("see_all_link", v)} />
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel defaultOpen title="Display Settings" color="green">
        <NumberField label="Rows to Show (4 cards per row)" value={n("rows")} onChange={(v) => set("rows", Math.max(1, Math.round(v)))} />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
          <select
            value={s("sort_order") || "newest"}
            onChange={(e) => set("sort_order", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="newest">Newest First</option>
            <option value="featured">Featured First</option>
            <option value="live_first">Live Courses First</option>
            <option value="recorded_first">Recorded Courses First</option>
          </select>
        </div>
        <p className="text-xs text-gray-400">Shows {n("rows")} row(s) × 4 cards = {n("rows") * 4} courses total. Mixes recorded, live and free courses.</p>
      </CollapsiblePanel>
    </div>
  );
}

// ─── Editor registry ──────────────────────────────────────────────────────────

export const EDITORS: Record<string, ComponentType<{ content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }>> = {
  // Home
  hero:              HeroEditor,
  hero_v2:           HeroV2Editor,
  feature_cards_v2:  FeatureCardsEditor,
  categories_v2:     CategoriesGridEditor,
  cta_banner_v2:     CtaBannerEditor,
  featured_collage_v2: FeaturedCollageEditor,
  courses_grid_v2:   CoursesGridV2Editor,
  instructors_v2:    InstructorsGridEditor,
  student_stories_v2: StudentStoriesEditor,
  articles_v2:       ArticlesEditor,
  faq_v2:            FaqAccordionEditor,
  newsletter_v2:     NewsletterEditor,
  top_courses:       TopCoursesEditor,
  upcoming_batches:  UpcomingBatchesEditor,
  all_courses:       AllCoursesEditor,
  recorded_courses:  RecordedCoursesEditor,
  our_courses:       OurCoursesEditor,
  flexible_learning: FlexibleLearningEditor,
  course_facilities: CourseFacilitiesEditor,
  testimonials:      TestimonialsEditor,
  get_started_steps: GetStartedStepsEditor,
  featured_in:       FeaturedInEditor,
  partners:          PartnersEditor,
  student_reviews:   StudentReviewsEditor,
  cta:               CTAEditor,
  success_stories:   SuccessStoriesEditor,
  certificate:       CertificateEditor,
  payment_method:    PaymentMethodEditor,
  join_instructor:   JoinInstructorEditor,
  community:         CommunityEditor,
  // Footer
  footer_info:       FooterInfoEditor,
  // Shared
  simple_hero:       SimpleHeroEditor,
  // Contact
  contact_info:      ContactInfoEditor,
  // Our Instructor
  mentor_grid:           MentorGridEditor,
  // Success Stories
  success_stories_panel: SuccessStoriesPanelEditor,
  // Live Classes
  batches_grid:          BatchesGridEditor,
  // Free Courses
  free_courses_grid:     FreeCoursesGridEditor,
  coming_soon_card:      ComingSoonCardEditor,
  // About
  about_intro:          AboutIntroEditor,
  founding_team:        FoundingTeamEditor,
  why_ict:              WhyIctEditor,
  media:                MediaEditor,
  milestones:           MilestonesEditor,
  about_stats:          AboutStatsEditor,           // kept for backwards compat
  about_mission_vision: AboutMissionVisionEditor,   // kept for backwards compat
  about_team:           AboutTeamEditor,            // kept for backwards compat
  // FAQ page
  faq_main:          FAQMainEditor,
  // Auth
  login_panel:       LoginPanelEditor,
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
