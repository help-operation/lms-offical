"use client";

import { useState, useEffect, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { Lbl, Panel, AddBtn, DelBtn, inputCls, type PanelReorder } from "./LiveCourseEditorUI";
import { LESSON_ICONS } from "@repo/ui/lesson-icons";
import type { LiveCourseTeacher, RecordedCourseSummary } from "./api";
import { fetchRecordedCoursesAction } from "./actions/live-courses.actions";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import { TOOL_COLORS } from "./live-course-editor.constants";
import type {
  PaymentLogo, BatchInfo, CurriculumItem, Tool, WhyItem, Instructor,
  WhatYouGetItem, VideoItem, Testimonial, ValueItem, FaqItem, VideoTabItem,
  T3FeatureItem, T3Level, T3Review, T3SuccessStory, T3VideoItem,
  T4ForWhomCard, T4Module,
} from "./live-course-editor.types";

export function FaqPanel({ value, onChange, panel, leading }: { value: FaqItem[]; onChange: Dispatch<SetStateAction<FaqItem[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="FAQ" {...panel}>
      {leading}
      {value.map((faq, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-start gap-2">
            <textarea value={faq.question}
              onChange={(e) => onChange((f) => f.map((x, j) => j === i ? { ...x, question: e.target.value } : x))}
              rows={2} placeholder="Question" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((f) => f.filter((_, j) => j !== i))} />
          </div>
          <textarea value={faq.answer}
            onChange={(e) => onChange((f) => f.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))}
            rows={3} placeholder="Answer..." className={inputCls} />
        </div>
      ))}
      <AddBtn label="Add FAQ" onClick={() => onChange((f) => [...f, { question: "", answer: "" }])} />
    </Panel>
  );
}

export function VideoTabsPanel({ value, onChange, panel, leading }: { value: VideoTabItem[]; onChange: Dispatch<SetStateAction<VideoTabItem[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Video Tabs (Categorised)" {...panel}>
      {leading}
      <p className="text-xs text-gray-400">Tabbed video gallery with categories (e.g. by topic or batch).</p>
      {value.map((tab, ti) => (
        <div key={ti} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={tab.category}
              onChange={(e) => onChange((tabs) => tabs.map((x, j) => j === ti ? { ...x, category: e.target.value } : x))}
              placeholder="Category name (e.g. Class 1)" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((tabs) => tabs.filter((_, j) => j !== ti))} />
          </div>
          <div className="pl-2 space-y-2">
            {tab.videos.map((vid, vi) => (
              <div key={vi} className="border border-gray-100 rounded-lg p-2 space-y-1.5 bg-white">
                <div className="flex items-center gap-2">
                  <input value={vid.url}
                    onChange={(e) => onChange((tabs) => tabs.map((x, j) => j === ti ? {
                      ...x, videos: x.videos.map((v, k) => k === vi ? { ...v, url: e.target.value } : v)
                    } : x))}
                    placeholder="YouTube URL" className={`${inputCls} flex-1 text-xs`} />
                  <DelBtn onClick={() => onChange((tabs) => tabs.map((x, j) => j === ti ? {
                    ...x, videos: x.videos.filter((_, k) => k !== vi)
                  } : x))} />
                </div>
                <input value={vid.title ?? ""}
                  onChange={(e) => onChange((tabs) => tabs.map((x, j) => j === ti ? {
                    ...x, videos: x.videos.map((v, k) => k === vi ? { ...v, title: e.target.value } : v)
                  } : x))}
                  placeholder="Video title (optional)" className={`${inputCls} text-xs`} />
              </div>
            ))}
            <AddBtn label="Add Video" onClick={() => onChange((tabs) => tabs.map((x, j) => j === ti ? {
              ...x, videos: [...x.videos, { url: "" }]
            } : x))} />
          </div>
        </div>
      ))}
      <AddBtn label="Add Tab" onClick={() => onChange((tabs) => [...tabs, { category: "", videos: [] }])} />
    </Panel>
  );
}

export function PaymentLogosPanel({ value, onChange, panel, leading }: { value: PaymentLogo[]; onChange: Dispatch<SetStateAction<PaymentLogo[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Payment Logos" {...panel}>
      {leading}
      {value.map((logo, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={logo.name}
            onChange={(e) => onChange((p) => p.map((l, j) => j === i ? { ...l, name: e.target.value } : l))}
            placeholder="Name (e.g. bKash)" className={`${inputCls} flex-1`} />
          <div className="flex-1">
            <ImagePickerField value={logo.image ?? ""} onChange={(v) => onChange((p) => p.map((l, j) => j === i ? { ...l, image: v } : l))} placeholder="Image URL" previewClassName="hidden" />
          </div>
          <DelBtn onClick={() => onChange((p) => p.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Logo" onClick={() => onChange((p) => [...p, { name: "" }])} />
    </Panel>
  );
}

export function BatchPanel({ value, onChange, panel, leading }: { value: BatchInfo; onChange: Dispatch<SetStateAction<BatchInfo>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Batch Information" {...panel}>
      {leading}
      <p className="text-xs text-gray-400">Displayed as info cards below the hero section.</p>
      <div>
        <Lbl text="Start Date" />
        <input value={value.startDate ?? ""}
          onChange={(e) => onChange((b) => ({ ...b, startDate: e.target.value }))}
          placeholder="১ জুন, ২০২৫" className={inputCls} />
      </div>
      <div>
        <Lbl text="Live Class Schedule" />
        <input value={value.liveSchedule ?? ""}
          onChange={(e) => onChange((b) => ({ ...b, liveSchedule: e.target.value }))}
          placeholder="শনি–বৃহস্পতি, রাত ১০টা" className={inputCls} />
      </div>
      <div>
        <Lbl text="Support Hours" />
        <input value={value.supportSchedule ?? ""}
          onChange={(e) => onChange((b) => ({ ...b, supportSchedule: e.target.value }))}
          placeholder="সকাল ১০টা – রাত ১০টা" className={inputCls} />
      </div>
      <div>
        <Lbl text="Seats Left" />
        <input value={value.seatsLeft ?? ""}
          onChange={(e) => onChange((b) => ({ ...b, seatsLeft: e.target.value }))}
          placeholder="মাত্র ৪৭টি আসন বাকি" className={inputCls} />
      </div>
    </Panel>
  );
}

export function CurriculumPanel({
  value, onChange,
  lessonIcon, onLessonIcon, showLessonIcon = false,
  panel, leading,
}: {
  value: CurriculumItem[];
  onChange: Dispatch<SetStateAction<CurriculumItem[]>>;
  lessonIcon?: string;
  onLessonIcon?: (v: string) => void;
  showLessonIcon?: boolean;
  panel?: PanelReorder;
  leading?: ReactNode;
}) {
  return (
    <Panel title="Curriculum" {...panel}>
      {leading}
      {showLessonIcon && onLessonIcon && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">Lesson Icon</p>
          <p className="text-[11px] text-gray-400">Icon shown before each lesson row in the published curriculum.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button" title="Template default"
              onClick={() => onLessonIcon("")}
              className={`flex h-9 items-center justify-center rounded-lg border px-2 text-xs transition-colors ${
                !lessonIcon ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              Default
            </button>
            {LESSON_ICONS.map(({ value: v, label, Icon }) => (
              <button
                key={v} type="button" title={label}
                onClick={() => onLessonIcon(v)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  lessonIcon === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      )}
      {value.map((mod, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={mod.title}
              onChange={(e) => onChange((c) => c.map((m, j) => j === i ? { ...m, title: e.target.value } : m))}
              placeholder={`Module ${i + 1} title`} className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((c) => c.filter((_, j) => j !== i))} />
          </div>
          <div className="pl-2 space-y-1.5">
            {mod.lessons.map((lesson, li) => (
              <div key={li} className="flex items-center gap-2">
                <input value={lesson}
                  onChange={(e) => onChange((c) => c.map((m, j) => j === i
                    ? { ...m, lessons: m.lessons.map((l, k) => k === li ? e.target.value : l) } : m))}
                  placeholder={`Lesson ${li + 1}`} className={`${inputCls} flex-1 text-xs`} />
                <DelBtn onClick={() => onChange((c) => c.map((m, j) => j === i
                  ? { ...m, lessons: m.lessons.filter((_, k) => k !== li) } : m))} />
              </div>
            ))}
            <AddBtn label="Add Lesson" onClick={() =>
              onChange((c) => c.map((m, j) => j === i ? { ...m, lessons: [...m.lessons, ""] } : m))} />
          </div>
        </div>
      ))}
      <AddBtn label="Add Module" onClick={() => onChange((c) => [...c, { title: "", lessons: [] }])} />
    </Panel>
  );
}

export function ToolsPanel({ value, onChange, panel, leading }: { value: Tool[]; onChange: Dispatch<SetStateAction<Tool[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Tools / Technologies" {...panel}>
      {leading}
      <p className="text-xs text-gray-400">Each tool displays as a large colored card. Set a hex bg color.</p>
      {value.map((tool, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <input value={tool.name}
              onChange={(e) => onChange((t) => t.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              placeholder="Tool name (e.g. React)" className={`${inputCls} min-w-0 flex-1`} />
            <DelBtn onClick={() => onChange((t) => t.filter((_, j) => j !== i))} />
          </div>
          <div className="flex items-center gap-2">
            <input value={tool.icon ?? ""}
              onChange={(e) => onChange((t) => t.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
              placeholder="Emoji/icon" className={`${inputCls} min-w-0 flex-1`} />
            <input type="color" value={tool.bgColor ?? "#6366F1"}
              onChange={(e) => onChange((t) => t.map((x, j) => j === i ? { ...x, bgColor: e.target.value } : x))}
              className="h-8 w-8 shrink-0 rounded cursor-pointer border border-gray-200 p-0.5" title="Background color" />
          </div>
        </div>
      ))}
      <AddBtn label="Add Tool" onClick={() => onChange((t) => [...t, { name: "", bgColor: TOOL_COLORS[t.length % TOOL_COLORS.length] }])} />
    </Panel>
  );
}

export function WhyPanel({ value, onChange, panel, leading }: { value: WhyItem[]; onChange: Dispatch<SetStateAction<WhyItem[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Why Different" {...panel}>
      {leading}
      {value.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={item.icon ?? ""}
              onChange={(e) => onChange((w) => w.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
              placeholder="Icon/emoji" className={`${inputCls} w-20 shrink-0`} />
            <DelBtn onClick={() => onChange((w) => w.filter((_, j) => j !== i))} />
          </div>
          <input value={item.title}
            onChange={(e) => onChange((w) => w.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
            placeholder="Feature title" className={inputCls} />
          <textarea value={item.description ?? ""}
            onChange={(e) => onChange((w) => w.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
            rows={2} placeholder="Description (optional)" className={inputCls} />
        </div>
      ))}
      <AddBtn label="Add Feature" onClick={() => onChange((w) => [...w, { title: "" }])} />
    </Panel>
  );
}

function teacherDisplayName(t: LiveCourseTeacher): string {
  return t.displayName || [t.firstName, t.lastName].filter(Boolean).join(" ").trim() || t.email;
}

function teacherToInstructor(t: LiveCourseTeacher): Instructor {
  return {
    name:     teacherDisplayName(t),
    title:    t.expertise ?? "",
    image:    t.displayAvatar || t.avatar || "",
    bio:      t.bio ?? "",
    students: t.totalStudents ? String(t.totalStudents) : "",
    courses:  t.totalCourses ? String(t.totalCourses) : "",
    rating:   t.rating && Number(t.rating) > 0 ? String(t.rating) : "",
  };
}

export function InstructorsPanel({
  value, onChange,
  teachers, teachersLoading = false, onLoadTeachers,
  panel, leading,
}: {
  value: Instructor[];
  onChange: Dispatch<SetStateAction<Instructor[]>>;
  teachers?: LiveCourseTeacher[];
  teachersLoading?: boolean;
  onLoadTeachers?: () => void;
  panel?: PanelReorder;
  leading?: ReactNode;
}) {
  const upd = (i: number, key: keyof Instructor, v: string) =>
    onChange((ins) => ins.map((x, j) => j === i ? { ...x, [key]: v } : x));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = (teachers ?? []).filter((t) => {
    const q = search.toLowerCase();
    return !q || teacherDisplayName(t).toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
  });
  const openPicker = () => {
    setPickerOpen(true);
    if (!teachers && onLoadTeachers) onLoadTeachers();
  };
  const pick = (t: LiveCourseTeacher) => {
    onChange((ins) => [...ins, teacherToInstructor(t)]);
    setPickerOpen(false);
    setSearch("");
  };

  return (
    <Panel title="Instructors" {...panel}>
      {leading}
      {value.map((inst, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Instructor {i + 1}</span>
            <DelBtn onClick={() => onChange((ins) => ins.filter((_, j) => j !== i))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Lbl text="Name *" />
              <input value={inst.name} onChange={(e) => upd(i, "name", e.target.value)} placeholder="Instructor Name" className={inputCls} />
            </div>
            <div className="col-span-2">
              <Lbl text="Title / Position" />
              <input value={inst.title ?? ""} onChange={(e) => upd(i, "title", e.target.value)} placeholder="Senior Developer @ Company" className={inputCls} />
            </div>
            <div><Lbl text="Years Experience" /><input value={inst.years ?? ""} onChange={(e) => upd(i, "years", e.target.value)} placeholder="8+" className={inputCls} /></div>
            <div><Lbl text="Clients" /><input value={inst.clients ?? ""} onChange={(e) => upd(i, "clients", e.target.value)} placeholder="50+" className={inputCls} /></div>
            <div><Lbl text="Projects" /><input value={inst.projects ?? ""} onChange={(e) => upd(i, "projects", e.target.value)} placeholder="120+" className={inputCls} /></div>
            <div><Lbl text="Rating" /><input value={inst.rating ?? ""} onChange={(e) => upd(i, "rating", e.target.value)} placeholder="4.9" className={inputCls} /></div>
            <div><Lbl text="Students" /><input value={inst.students ?? ""} onChange={(e) => upd(i, "students", e.target.value)} placeholder="5,000+" className={inputCls} /></div>
            <div><Lbl text="Courses" /><input value={inst.courses ?? ""} onChange={(e) => upd(i, "courses", e.target.value)} placeholder="8" className={inputCls} /></div>
            <div className="col-span-2"><Lbl text="Photo URL" /><input value={inst.image ?? ""} onChange={(e) => upd(i, "image", e.target.value)} placeholder="https://..." className={inputCls} /></div>
            <div className="col-span-2"><Lbl text="Profile URL" /><input value={inst.profileUrl ?? ""} onChange={(e) => upd(i, "profileUrl", e.target.value)} placeholder="https://..." className={inputCls} /></div>
            <div className="col-span-2"><Lbl text="Bio" /><textarea value={inst.bio ?? ""} onChange={(e) => upd(i, "bio", e.target.value)} rows={2} placeholder="Short bio..." className={inputCls} /></div>
          </div>
        </div>
      ))}

      {pickerOpen && (
        <div className="rounded-xl border border-brand-200 bg-white p-2 space-y-2 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-gray-600">Select a teacher</span>
            <button type="button" onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers…" className={inputCls} />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {teachersLoading ? (
              <p className="px-1 py-2 text-xs text-gray-400">Loading teachers…</p>
            ) : filtered.length === 0 ? (
              <p className="px-1 py-2 text-xs text-gray-400">No teachers found.</p>
            ) : filtered.map((t) => (
              <button key={t.id} type="button" onClick={() => pick(t)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-brand-50">
                {(t.displayAvatar || t.avatar) ? (
                  <img src={t.displayAvatar || t.avatar || ""} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                    {teacherDisplayName(t).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-gray-800">{teacherDisplayName(t)}</span>
                  {t.expertise && <span className="block truncate text-[11px] text-gray-400">{t.expertise}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AddBtn label="Add Instructor" onClick={() => onChange((ins) => [...ins, { name: "" }])} />
        {onLoadTeachers && (
          <button type="button" onClick={openPicker}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            + Add from teachers
          </button>
        )}
      </div>
    </Panel>
  );
}

export function WhatYouGetPanel({ value, onChange, panel, leading }: { value: WhatYouGetItem[]; onChange: Dispatch<SetStateAction<WhatYouGetItem[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="What You Get" {...panel}>
      {leading}
      {value.map((item, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={item.icon ?? ""}
              onChange={(e) => onChange((w) => w.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
              placeholder="Emoji" className={`${inputCls} w-20 shrink-0`} />
            <input value={item.title}
              onChange={(e) => onChange((w) => w.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
              placeholder="Benefit title" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((w) => w.filter((_, j) => j !== i))} />
          </div>
          <input value={item.description ?? ""}
            onChange={(e) => onChange((w) => w.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
            placeholder="Description (optional)" className={inputCls} />
        </div>
      ))}
      <AddBtn label="Add Benefit" onClick={() => onChange((w) => [...w, { title: "" }])} />
    </Panel>
  );
}

export function VideosPanel({ value, onChange, panel, leading }: { value: VideoItem[]; onChange: Dispatch<SetStateAction<VideoItem[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="YouTube Videos" {...panel}>
      {leading}
      {value.map((vid, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={vid.url}
              onChange={(e) => onChange((v) => v.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
              placeholder="YouTube URL" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((v) => v.filter((_, j) => j !== i))} />
          </div>
          <input value={vid.title ?? ""}
            onChange={(e) => onChange((v) => v.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
            placeholder="Video title (optional)" className={inputCls} />
        </div>
      ))}
      <AddBtn label="Add Video" onClick={() => onChange((v) => [...v, { url: "" }])} />
    </Panel>
  );
}

export function TestimonialsPanel({ value, onChange, panel, leading }: { value: Testimonial[]; onChange: Dispatch<SetStateAction<Testimonial[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Student Testimonials" {...panel}>
      {leading}
      <p className="text-xs text-gray-400">Displayed below the videos section as text reviews.</p>
      {value.map((t, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={t.name}
              onChange={(e) => onChange((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              placeholder="Student name" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((arr) => arr.filter((_, j) => j !== i))} />
          </div>
          <input value={t.role ?? ""}
            onChange={(e) => onChange((arr) => arr.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
            placeholder="Role (e.g. Junior Developer @ Company)" className={inputCls} />
          <textarea value={t.review}
            onChange={(e) => onChange((arr) => arr.map((x, j) => j === i ? { ...x, review: e.target.value } : x))}
            rows={2} placeholder="Review text..." className={inputCls} />
        </div>
      ))}
      <AddBtn label="Add Testimonial" onClick={() => onChange((arr) => [...arr, { name: "", review: "" }])} />
    </Panel>
  );
}

interface ValueSectionText { heading?: string; totalLabel?: string; offerLine?: string; ctaText?: string }

export function ValuePanel({
  value, onChange,
  valueSection, onValueSection, showValueText = false,
  panel, leading,
}: {
  value: ValueItem[];
  onChange: Dispatch<SetStateAction<ValueItem[]>>;
  valueSection?: ValueSectionText;
  onValueSection?: (patch: Partial<ValueSectionText>) => void;
  showValueText?: boolean;
  panel?: PanelReorder;
  leading?: ReactNode;
}) {
  return (
    <Panel title="Value Breakdown" {...panel}>
      {leading}
      {showValueText && onValueSection && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">Section Text</p>
          <div>
            <Lbl text="Heading" />
            <input
              value={valueSection?.heading ?? ""}
              onChange={(e) => onValueSection({ heading: e.target.value })}
              placeholder="চলুন দেখি এই টাকায় আপনি কি পরিমাণ ভ্যালু পাচ্ছেন"
              className={inputCls}
            />
          </div>
          <div>
            <Lbl text="Total label" />
            <input
              value={valueSection?.totalLabel ?? ""}
              onChange={(e) => onValueSection({ totalLabel: e.target.value })}
              placeholder="টোটাল {value} টাকার বেশি ভ্যালু পাচ্ছেন!"
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-0.5">Use <code>{"{value}"}</code> where the total amount appears.</p>
          </div>
          <div>
            <Lbl text="Offer line" />
            <input
              value={valueSection?.offerLine ?? ""}
              onChange={(e) => onValueSection({ offerLine: e.target.value })}
              placeholder="বিশেষ ছাড়ে পাচ্ছেন ৳{price} টাকায়! এই অফার চলবে:"
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-0.5">Use <code>{"{price}"}</code> where the discounted price appears.</p>
          </div>
          <div>
            <Lbl text="Button text" />
            <input
              value={valueSection?.ctaText ?? ""}
              onChange={(e) => onValueSection({ ctaText: e.target.value })}
              placeholder="এখনই এনরোল করুন"
              className={inputCls}
            />
          </div>
        </div>
      )}
      {value.map((item, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-gray-400">{i + 1}.</span>
            <input value={item.title}
              onChange={(e) => onChange((v) => v.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
              placeholder="Item name (e.g. Full Course Access)" className={`${inputCls} min-w-0 flex-1`} />
            <DelBtn onClick={() => onChange((v) => v.filter((_, j) => j !== i))} />
          </div>
          <div className="flex items-center gap-1 pl-5">
            <span className="shrink-0 text-sm text-gray-400">৳</span>
            <input value={item.value}
              onChange={(e) => onChange((v) => v.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
              placeholder="Value (e.g. 12000)" className={`${inputCls} w-full`} />
          </div>
        </div>
      ))}
      <AddBtn label="Add Item" onClick={() => onChange((v) => [...v, { title: "", value: "" }])} />
    </Panel>
  );
}

export function T6CredentialsBarPanel({ value, onChange, panel }: { value: Array<{ icon: string; label: string }>; onChange: Dispatch<SetStateAction<Array<{ icon: string; label: string }>>>; panel?: PanelReorder }) {
  return (
    <Panel title="Credentials Bar" {...panel}>
      <p className="text-xs text-gray-400">Top strip with medical credentials/icons (e.g. ৩০০ জন সক্রিয় শিক্ষার্থী, ৯৩টি লাইভ ক্লাস).</p>
      {value.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={c.icon} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} placeholder="Icon" className={`${inputCls} w-20`} />
          <input value={c.label} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="৩০০ জন সক্রিয় শিক্ষার্থী" className={`${inputCls} flex-1`} />
          <DelBtn onClick={() => onChange((pp) => pp.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Credential" onClick={() => onChange((pp) => [...pp, { icon: "users", label: "" }])} />
    </Panel>
  );
}

export function T6StatsBarPanel({ value, onChange, panel }: { value: Array<{ value: string; label: string }>; onChange: Dispatch<SetStateAction<Array<{ value: string; label: string }>>>; panel?: PanelReorder }) {
  return (
    <Panel title="Stats Bar" {...panel}>
      <p className="text-xs text-gray-400">Statistics cards displayed below the hero (e.g. ৩০০ জন শিক্ষার্থী, ৯৩টি ক্লাস).</p>
      {value.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={s.value} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="৩০০" className={`${inputCls} w-24`} />
          <input value={s.label} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="সক্রিয় শিক্ষার্থী" className={`${inputCls} flex-1`} />
          <DelBtn onClick={() => onChange((pp) => pp.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Stat" onClick={() => onChange((pp) => [...pp, { value: "", label: "" }])} />
    </Panel>
  );
}

export function T6ComparisonPanel({ value, onChange, panel }: { value: Array<{ feature: string; selfStudy: boolean; liveCourse: boolean }>; onChange: Dispatch<SetStateAction<Array<{ feature: string; selfStudy: boolean; liveCourse: boolean }>>>; panel?: PanelReorder }) {
  return (
    <Panel title="Comparison Table" {...panel}>
      <p className="text-xs text-gray-400">Feature comparison between self-study and live course.</p>
      {value.map((row, i) => (
        <div key={i} className="space-y-1 rounded-lg border border-gray-100 p-2">
          <div className="flex items-center gap-2">
            <input value={row.feature} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, feature: e.target.value } : x))} placeholder="Feature name" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((pp) => pp.filter((_, j) => j !== i))} />
          </div>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-1"><input type="checkbox" checked={row.selfStudy} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, selfStudy: e.target.checked } : x))} /> Self Study</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={row.liveCourse} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, liveCourse: e.target.checked } : x))} /> Live Course</label>
          </div>
        </div>
      ))}
      <AddBtn label="Add Feature Row" onClick={() => onChange((pp) => [...pp, { feature: "", selfStudy: false, liveCourse: true }])} />
    </Panel>
  );
}

export function T6OrganGridPanel({ value, onChange, panel }: { value: Array<{ name: string; icon?: string }>; onChange: Dispatch<SetStateAction<Array<{ name: string; icon?: string }>>>; panel?: PanelReorder }) {
  return (
    <Panel title="Organ Grid" {...panel}>
      <p className="text-xs text-gray-400">Organ illustration cards (Brain, Heart, Lungs, etc.).</p>
      {value.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={o.name} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Brain" className={`${inputCls} flex-1`} />
          <input value={o.icon ?? ""} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} placeholder="Icon URL" className={`${inputCls} w-32`} />
          <DelBtn onClick={() => onChange((pp) => pp.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Organ" onClick={() => onChange((pp) => [...pp, { name: "", icon: "" }])} />
    </Panel>
  );
}

export function T6InstructorPanel({ value, onChange, panel }: { value: { name?: string; title?: string; credentials?: string; photo?: string; hospital?: string }; onChange: Dispatch<SetStateAction<{ name?: string; title?: string; credentials?: string; photo?: string; hospital?: string }>>; panel?: PanelReorder }) {
  return (
    <Panel title="Instructor" {...panel}>
      <div><Lbl text="Name" /><input value={value.name ?? ""} onChange={(e) => onChange((pp) => ({ ...pp, name: e.target.value }))} placeholder="ডা. আল আমিন সূদা" className={inputCls} /></div>
      <div><Lbl text="Title" /><input value={value.title ?? ""} onChange={(e) => onChange((pp) => ({ ...pp, title: e.target.value }))} placeholder="প্রশিক্ষক" className={inputCls} /></div>
      <div><Lbl text="Credentials" /><input value={value.credentials ?? ""} onChange={(e) => onChange((pp) => ({ ...pp, credentials: e.target.value }))} placeholder="যুক্তরাজ্যের..." className={inputCls} /></div>
      <div><Lbl text="Hospital" /><input value={value.hospital ?? ""} onChange={(e) => onChange((pp) => ({ ...pp, hospital: e.target.value }))} placeholder="হোমিও সেবা কেন্দ্র" className={inputCls} /></div>
      <div><Lbl text="Photo URL" /><ImagePickerField value={value.photo ?? ""} onChange={(v) => onChange((pp) => ({ ...pp, photo: v }))} /></div>
    </Panel>
  );
}

export function T6WhoForPanel({ value, onChange, panel }: { value: { title?: string; items?: string[] }; onChange: Dispatch<SetStateAction<{ title?: string; items?: string[] }>>; panel?: PanelReorder }) {
  return (
    <Panel title="Who Is This For" {...panel}>
      <div><Lbl text="Section Title" /><input value={value.title ?? ""} onChange={(e) => onChange((pp) => ({ ...pp, title: e.target.value }))} placeholder="এই কোর্সে যা যা পাচ্ছেন" className={inputCls} /></div>
      {(value.items ?? []).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={(e) => onChange((pp) => ({ ...pp, items: (pp.items ?? []).map((x, j) => j === i ? e.target.value : x) }))} placeholder="Feature item" className={`${inputCls} flex-1`} />
          <DelBtn onClick={() => onChange((pp) => ({ ...pp, items: (pp.items ?? []).filter((_, j) => j !== i) }))} />
        </div>
      ))}
      <AddBtn label="Add Item" onClick={() => onChange((pp) => ({ ...pp, items: [...(pp.items ?? []), ""] }))} />
    </Panel>
  );
}

export function T6ValueBreakdownPanel({ value, onChange, panel }: { value: { tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }> }; onChange: Dispatch<SetStateAction<{ tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }> }>>; panel?: PanelReorder }) {
  return (
    <Panel title="Value / Pricing" {...panel}>
      <p className="text-xs text-gray-400">Pricing tiers for the course (one-time, monthly, annual).</p>
      {(value.tiers ?? []).map((tier, i) => (
        <div key={i} className="space-y-1 rounded-lg border border-gray-100 p-2">
          <div className="flex items-center gap-2">
            <input value={tier.name} onChange={(e) => onChange((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} placeholder="Tier name" className={`${inputCls} flex-1`} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={tier.highlighted ?? false} onChange={(e) => onChange((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, highlighted: e.target.checked } : x) }))} /> Featured</label>
            <DelBtn onClick={() => onChange((pp) => ({ ...pp, tiers: (pp.tiers ?? []).filter((_, j) => j !== i) }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Lbl text="Price" /><input value={tier.price} onChange={(e) => onChange((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} placeholder="৮৫,০০০" className={inputCls} /></div>
            <div><Lbl text="Period" /><input value={tier.period} onChange={(e) => onChange((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, period: e.target.value } : x) }))} placeholder="এককালীন" className={inputCls} /></div>
          </div>
        </div>
      ))}
      <AddBtn label="Add Pricing Tier" onClick={() => onChange((pp) => ({ ...pp, tiers: [...(pp.tiers ?? []), { name: "", price: "", period: "", features: [], highlighted: false }] }))} />
    </Panel>
  );
}

export function T6VideoPanel({ value, onChange, panel }: { value: string; onChange: Dispatch<SetStateAction<string>>; panel?: PanelReorder }) {
  return (
    <Panel title="Intro Video" {...panel}>
      <div><Lbl text="Video URL" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://youtube.com/..." className={inputCls} /></div>
    </Panel>
  );
}

export function T6TestimonialsPanel({ value, onChange, panel }: { value: Array<{ name: string; rating?: number; text: string; photo?: string }>; onChange: Dispatch<SetStateAction<Array<{ name: string; rating?: number; text: string; photo?: string }>>>; panel?: PanelReorder }) {
  return (
    <Panel title="Testimonials" {...panel}>
      {value.map((t, i) => (
        <div key={i} className="space-y-1 rounded-lg border border-gray-100 p-2">
          <div className="flex items-center gap-2">
            <input value={t.name} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Student name" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange((pp) => pp.filter((_, j) => j !== i))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Lbl text="Rating" /><input type="number" min={1} max={5} value={t.rating ?? 5} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, rating: Number(e.target.value) } : x))} className={inputCls} /></div>
            <div><Lbl text="Photo URL" /><ImagePickerField value={t.photo ?? ""} onChange={(v) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, photo: v } : x))} /></div>
          </div>
          <div><Lbl text="Review Text" /><textarea value={t.text} onChange={(e) => onChange((pp) => pp.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} rows={2} placeholder="Review text" className={inputCls} /></div>
        </div>
      ))}
      <AddBtn label="Add Testimonial" onClick={() => onChange((pp) => [...pp, { name: "", rating: 5, text: "", photo: "" }])} />
    </Panel>
  );
}

// ─── Template 3 panels ────────────────────────────────────────────────────────

export function T3WhyJoinPanel({ value, onChange, panel, leading }: { value: string[]; onChange: Dispatch<SetStateAction<string[]>>; panel?: PanelReorder; leading?: ReactNode }) {
  return (
    <Panel title="Why Join Grid" {...panel}>
      {leading}
      <p className="text-xs text-gray-400">2-column grid of checkbox reasons to join.</p>
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={(e) => onChange((p) => p.map((x, j) => j === i ? e.target.value : x))}
            placeholder="যদি ক্যারিয়ারে দ্রুত সফল হতে চান" className={`${inputCls} flex-1`} />
          <DelBtn onClick={() => onChange((p) => p.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Reason" onClick={() => onChange((p) => [...p, ""])} />
    </Panel>
  );
}

export function T3FeaturesGridPanel({
  title, subtitle, items, onTitle, onSubtitle, onItems, panel, leading,
}: {
  title: string; subtitle: string; items: T3FeatureItem[];
  onTitle: (v: string) => void; onSubtitle: (v: string) => void;
  onItems: Dispatch<SetStateAction<T3FeatureItem[]>>;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title="Features Grid (3×3)" {...panel}>
      {leading}
      <p className="text-xs text-gray-400">3-column grid of icon + text features.</p>
      <div>
        <Lbl text="Section Title" />
        <input value={title} onChange={(e) => onTitle(e.target.value)}
          placeholder="সঠিক উপায়ে ... যা পাচ্ছেন" className={inputCls} />
      </div>
      <div>
        <Lbl text="Subtitle" />
        <input value={subtitle} onChange={(e) => onSubtitle(e.target.value)}
          placeholder="১০০+ প্র্যাকটিক্যাল ভিডিওসহ" className={inputCls} />
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item.icon ?? ""} onChange={(e) => onItems((p) => p.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
            placeholder="Icon/emoji 🏆" className={`${inputCls} w-16 text-center`} />
          <input value={item.text} onChange={(e) => onItems((p) => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
            placeholder="Feature text" className={`${inputCls} flex-1`} />
          <DelBtn onClick={() => onItems((p) => p.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Feature" onClick={() => onItems((p) => [...p, { icon: "", text: "" }])} />
    </Panel>
  );
}

export function T3BonusChecklistPanel({
  title, items, onTitle, onItems, panel, leading,
}: {
  title: string; items: string[]; onTitle: (v: string) => void;
  onItems: Dispatch<SetStateAction<string[]>>;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title="Bonus Checklist" {...panel}>
      {leading}
      <div>
        <Lbl text="Section Title" />
        <input value={title} onChange={(e) => onTitle(e.target.value)}
          placeholder="আরও যে ভ্যালু পাবেন" className={inputCls} />
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={(e) => onItems((p) => p.map((x, j) => j === i ? e.target.value : x))}
            placeholder="অনলাইন বিজনেসের A to Z ক্লিয়ার ধারণা" className={`${inputCls} flex-1`} />
          <DelBtn onClick={() => onItems((p) => p.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Item" onClick={() => onItems((p) => [...p, ""])} />
    </Panel>
  );
}

export function T3SupportLevelsPanel({
  title, subtitle, levels, onTitle, onSubtitle, onLevels, panel, leading,
}: {
  title: string; subtitle: string; levels: T3Level[];
  onTitle: (v: string) => void; onSubtitle: (v: string) => void;
  onLevels: Dispatch<SetStateAction<T3Level[]>>;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title="Level Roadmap" {...panel}>
      {leading}
      <div>
        <Lbl text="Section Title" />
        <input value={title} onChange={(e) => onTitle(e.target.value)}
          placeholder="অ্যাডভান্স লেভেল বেজড সাপোর্ট সিস্টেম" className={inputCls} />
      </div>
      <div>
        <Lbl text="Subtitle" />
        <input value={subtitle} onChange={(e) => onSubtitle(e.target.value)}
          placeholder="যা আপনাকে শূন্য থেকে গাইড করবে" className={inputCls} />
      </div>
      {levels.map((lv, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={lv.label} onChange={(e) => onLevels((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
              placeholder={`Level-${i + 1}`} className={`${inputCls} w-24`} />
            <input value={lv.color ?? ""} onChange={(e) => onLevels((p) => p.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
              placeholder="Color (e.g. #14b8a6)" className={`${inputCls} w-32`} />
            <DelBtn onClick={() => onLevels((p) => p.filter((_, j) => j !== i))} />
          </div>
          <textarea value={lv.description} onChange={(e) => onLevels((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
            rows={3} placeholder="Level description..." className={`${inputCls} text-xs`} />
        </div>
      ))}
      <AddBtn label="Add Level" onClick={() => onLevels((p) => [...p, { label: `Level-${p.length + 1}`, description: "", color: "#14b8a6" }])} />
    </Panel>
  );
}

export function T3ImageSliderPanel({
  panelTitle, sectionTitle, sectionSubtitle, images, caption,
  onTitle, onSubtitle, onImages, onCaption, showCaption, panel, leading,
}: {
  panelTitle: string; sectionTitle: string; sectionSubtitle: string;
  images: string[]; caption?: string; showCaption?: boolean;
  onTitle: (v: string) => void; onSubtitle: (v: string) => void;
  onImages: Dispatch<SetStateAction<string[]>>; onCaption?: (v: string) => void;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title={panelTitle} {...panel}>
      {leading}
      <div>
        <Lbl text="Section Title" />
        <input value={sectionTitle} onChange={(e) => onTitle(e.target.value)} className={inputCls} />
      </div>
      <div>
        <Lbl text="Subtitle" />
        <input value={sectionSubtitle} onChange={(e) => onSubtitle(e.target.value)} className={inputCls} />
      </div>
      {showCaption && onCaption && (
        <div>
          <Lbl text="Caption (shown below slider)" />
          <input value={caption ?? ""} onChange={(e) => onCaption(e.target.value)} className={inputCls} />
        </div>
      )}
      <Lbl text="Image URLs" />
      {images.map((img, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">
            <ImagePickerField value={img} onChange={(v) => onImages((p) => p.map((x, j) => j === i ? v : x))} previewClassName="hidden" />
          </div>
          <DelBtn onClick={() => onImages((p) => p.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Image URL" onClick={() => onImages((p) => [...p, ""])} />
    </Panel>
  );
}

export function T3TextReviewsPanel({
  title, reviews, onTitle, onReviews, panel, leading,
}: {
  title: string; reviews: T3Review[];
  onTitle: (v: string) => void; onReviews: Dispatch<SetStateAction<T3Review[]>>;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title="Text Reviews Slider" {...panel}>
      {leading}
      <div>
        <Lbl text="Section Title" />
        <input value={title} onChange={(e) => onTitle(e.target.value)} className={inputCls} />
      </div>
      {reviews.map((r, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={r.name} onChange={(e) => onReviews((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              placeholder="Reviewer name" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onReviews((p) => p.filter((_, j) => j !== i))} />
          </div>
          <input value={r.role ?? ""} onChange={(e) => onReviews((p) => p.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}
            placeholder="Role / Title" className={inputCls} />
          <ImagePickerField value={r.avatar ?? ""} onChange={(v) => onReviews((p) => p.map((x, j) => j === i ? { ...x, avatar: v } : x))} placeholder="Avatar image URL" previewClassName="hidden" />
          <textarea value={r.text} onChange={(e) => onReviews((p) => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
            rows={3} placeholder="Review text..." className={`${inputCls} text-xs`} />
        </div>
      ))}
      <AddBtn label="Add Review" onClick={() => onReviews((p) => [...p, { name: "", text: "" }])} />
    </Panel>
  );
}

export function T3SuccessStoriesPanel({
  title, stories, onTitle, onStories, panel, leading,
}: {
  title: string; stories: T3SuccessStory[];
  onTitle: (v: string) => void; onStories: Dispatch<SetStateAction<T3SuccessStory[]>>;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title="Success Stories" {...panel}>
      {leading}
      <div>
        <Lbl text="Section Title" />
        <input value={title} onChange={(e) => onTitle(e.target.value)} className={inputCls} />
      </div>
      {stories.map((s, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2">
            <input value={s.name} onChange={(e) => onStories((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              placeholder="Name" className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onStories((p) => p.filter((_, j) => j !== i))} />
          </div>
          <input value={s.badge ?? ""} onChange={(e) => onStories((p) => p.map((x, j) => j === i ? { ...x, badge: e.target.value } : x))}
            placeholder="Badge (e.g. ফ্রিল্যান্সার থেকে সফল উদ্যোক্তা!)" className={inputCls} />
          <input value={s.description ?? ""} onChange={(e) => onStories((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
            placeholder="Short description" className={inputCls} />
          <input value={s.image ?? ""} onChange={(e) => onStories((p) => p.map((x, j) => j === i ? { ...x, image: e.target.value } : x))}
            placeholder="Thumbnail image URL" className={inputCls} />
        </div>
      ))}
      <AddBtn label="Add Story" onClick={() => onStories((p) => [...p, { name: "" }])} />
    </Panel>
  );
}

export function T3VideoGridPanel({
  title, videos, onTitle, onVideos, panel, leading,
}: {
  title: string; videos: T3VideoItem[];
  onTitle: (v: string) => void; onVideos: Dispatch<SetStateAction<T3VideoItem[]>>;
  panel?: PanelReorder; leading?: ReactNode;
}) {
  return (
    <Panel title="Video Grid" {...panel}>
      {leading}
      <div>
        <Lbl text="Section Title" />
        <input value={title} onChange={(e) => onTitle(e.target.value)} className={inputCls} />
      </div>
      {videos.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={v.url} onChange={(e) => onVideos((p) => p.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
            placeholder="YouTube URL" className={`${inputCls} flex-1`} />
          <div className="flex-1">
            <ImagePickerField value={v.thumbnail ?? ""} onChange={(val) => onVideos((p) => p.map((x, j) => j === i ? { ...x, thumbnail: val } : x))} placeholder="Thumbnail URL (auto from YouTube)" previewClassName="hidden" />
          </div>
          <DelBtn onClick={() => onVideos((p) => p.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn label="Add Video" onClick={() => onVideos((p) => [...p, { url: "" }])} />
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 4 — Nexemy Style panels
// ─────────────────────────────────────────────────────────────────────────────

export function T4LiveSessionCardPanel({
  value, onChange, panel,
}: {
  value: { batchLabel?: string; title?: string; description?: string; mentorLine1?: string; mentorLine2?: string; features?: string[]; ctaText?: string };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  const set = (k: keyof typeof value, v: string) => onChange({ ...value, [k]: v });
  const features = value.features ?? [];
  return (
    <Panel title="Live Session Card (Hero Overlay)" {...panel}>
      <p className="text-xs text-gray-400">Floating card shown over the hero video.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl text="Batch Label" /><input value={value.batchLabel ?? ""} onChange={(e) => set("batchLabel", e.target.value)} placeholder="Batch 4" className={inputCls} /></div>
        <div><Lbl text="CTA Button Text" /><input value={value.ctaText ?? ""} onChange={(e) => set("ctaText", e.target.value)} placeholder="এখনই ভর্তি হন" className={inputCls} /></div>
      </div>
      <div><Lbl text="Card Title" /><input value={value.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Live Upwork Freelancing Course" className={inputCls} /></div>
      <div><Lbl text="Description" /><input value={value.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Complete A-Z course with live mentoring" className={inputCls} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl text="Mentor Line 1 (name)" /><input value={value.mentorLine1 ?? ""} onChange={(e) => set("mentorLine1", e.target.value)} placeholder="Instructor: Jahangir Alam" className={inputCls} /></div>
        <div><Lbl text="Mentor Line 2 (title)" /><input value={value.mentorLine2 ?? ""} onChange={(e) => set("mentorLine2", e.target.value)} placeholder="Top-Rated Upwork Freelancer" className={inputCls} /></div>
      </div>
      <div>
        <Lbl text="Feature Bullets" />
        {features.map((f, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <input value={f} onChange={(e) => onChange({ ...value, features: features.map((x, j) => j === i ? e.target.value : x) })}
              placeholder={`Feature ${i + 1}`} className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange({ ...value, features: features.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <AddBtn label="Add Feature" onClick={() => onChange({ ...value, features: [...features, ""] })} />
      </div>
    </Panel>
  );
}

export function T4StudentProgressPanel({
  value, onChange, panel,
}: {
  value: { preText?: string; title?: string; images?: string[] };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  const images = value.images ?? [];
  return (
    <Panel title="Student Progress Gallery" {...panel}>
      <div><Lbl text="Pre-text (above heading)" /><input value={value.preText ?? ""} onChange={(e) => onChange({ ...value, preText: e.target.value })} placeholder="আমাদের শিক্ষার্থীরা..." className={inputCls} /></div>
      <div><Lbl text="Section Heading" /><input value={value.title ?? ""} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="তাদের সাফল্য দেখুন" className={inputCls} /></div>
      <div>
        <Lbl text="Screenshot Image URLs" />
        {images.map((img, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <input value={img} onChange={(e) => onChange({ ...value, images: images.map((x, j) => j === i ? e.target.value : x) })}
              placeholder="https://..." className={`${inputCls} flex-1`} />
            <DelBtn onClick={() => onChange({ ...value, images: images.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <AddBtn label="Add Image" onClick={() => onChange({ ...value, images: [...images, ""] })} />
      </div>
    </Panel>
  );
}

export function T4ForWhomPanel({
  value, onChange, panel,
}: {
  value: { title?: string; titleHighlight?: string; cards?: T4ForWhomCard[]; closingText?: string };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  const cards = value.cards ?? [];
  return (
    <Panel title="For Whom Section" {...panel}>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl text="Title" /><input value={value.title ?? ""} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="কাদের জন্য এই কোর্স?" className={inputCls} /></div>
        <div><Lbl text="Title Highlight (purple box)" /><input value={value.titleHighlight ?? ""} onChange={(e) => onChange({ ...value, titleHighlight: e.target.value })} placeholder="এই কোর্স" className={inputCls} /></div>
      </div>
      <div><Lbl text="Closing Text (below cards)" /><input value={value.closingText ?? ""} onChange={(e) => onChange({ ...value, closingText: e.target.value })} placeholder="আপনি যদি উপরের যেকোনো..." className={inputCls} /></div>
      <div>
        <Lbl text="Audience Cards" />
        {cards.map((card, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-1 bg-gray-50 mb-2">
            <div className="flex gap-2">
              <input value={card.icon ?? ""} onChange={(e) => onChange({ ...value, cards: cards.map((c, j) => j === i ? { ...c, icon: e.target.value } : c) })}
                placeholder="Emoji icon" className={`${inputCls} w-20`} />
              <input value={card.title} onChange={(e) => onChange({ ...value, cards: cards.map((c, j) => j === i ? { ...c, title: e.target.value } : c) })}
                placeholder="Card title" className={`${inputCls} flex-1`} />
              <DelBtn onClick={() => onChange({ ...value, cards: cards.filter((_, j) => j !== i) })} />
            </div>
            <input value={card.description ?? ""} onChange={(e) => onChange({ ...value, cards: cards.map((c, j) => j === i ? { ...c, description: e.target.value } : c) })}
              placeholder="Description" className={`${inputCls} text-xs`} />
          </div>
        ))}
        <AddBtn label="Add Card" onClick={() => onChange({ ...value, cards: [...cards, { title: "" }] })} />
      </div>
    </Panel>
  );
}

export function T4InstructorStoryPanel({
  value, onChange, panel,
}: {
  value: { title?: string; titleHighlight?: string; bio?: string; videoUrl?: string };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  return (
    <Panel title="Instructor Story (Bio + Video)" {...panel}>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl text="Section Title" /><input value={value.title ?? ""} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="আমার গল্প" className={inputCls} /></div>
        <div><Lbl text="Title Highlight" /><input value={value.titleHighlight ?? ""} onChange={(e) => onChange({ ...value, titleHighlight: e.target.value })} placeholder="গল্প" className={inputCls} /></div>
      </div>
      <div><Lbl text="Bio / Story Text" /><textarea value={value.bio ?? ""} onChange={(e) => onChange({ ...value, bio: e.target.value })} rows={5} placeholder="আমি ২০১৮ সালে Upwork শুরু করেছিলাম..." className={`${inputCls} resize-none`} /></div>
      <div><Lbl text="YouTube Video URL" /><input value={value.videoUrl ?? ""} onChange={(e) => onChange({ ...value, videoUrl: e.target.value })} placeholder="https://youtube.com/embed/..." className={inputCls} /></div>
    </Panel>
  );
}

export function T4ModuleGridPanel({
  value, onChange, panel,
}: {
  value: { title?: string; titleHighlight?: string; modules?: T4Module[] };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  const modules = value.modules ?? [];
  return (
    <Panel title="Module Grid (Dark Purple)" {...panel}>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl text="Section Title" /><input value={value.title ?? ""} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="কোর্স মডিউল" className={inputCls} /></div>
        <div><Lbl text="Title Highlight" /><input value={value.titleHighlight ?? ""} onChange={(e) => onChange({ ...value, titleHighlight: e.target.value })} placeholder="মডিউল" className={inputCls} /></div>
      </div>
      {modules.map((mod, i) => (
        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
          <div className="flex gap-2 items-center">
            <input value={mod.icon ?? ""} onChange={(e) => onChange({ ...value, modules: modules.map((m, j) => j === i ? { ...m, icon: e.target.value } : m) })}
              placeholder="Emoji" className={`${inputCls} w-16`} />
            <input value={mod.title} onChange={(e) => onChange({ ...value, modules: modules.map((m, j) => j === i ? { ...m, title: e.target.value } : m) })}
              placeholder="Module title" className={`${inputCls} flex-1`} />
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <input type="checkbox" checked={mod.fullWidth ?? false}
                onChange={(e) => onChange({ ...value, modules: modules.map((m, j) => j === i ? { ...m, fullWidth: e.target.checked } : m) })} />
              Full-width
            </label>
            <DelBtn onClick={() => onChange({ ...value, modules: modules.filter((_, j) => j !== i) })} />
          </div>
          <div className="pl-1 space-y-1">
            {(mod.bullets ?? []).map((b, bi) => (
              <div key={bi} className="flex gap-2">
                <input value={b} onChange={(e) => onChange({ ...value, modules: modules.map((m, j) => j === i ? { ...m, bullets: (m.bullets ?? []).map((x, k) => k === bi ? e.target.value : x) } : m) })}
                  placeholder={`Bullet ${bi + 1}`} className={`${inputCls} flex-1 text-xs`} />
                <DelBtn onClick={() => onChange({ ...value, modules: modules.map((m, j) => j === i ? { ...m, bullets: (m.bullets ?? []).filter((_, k) => k !== bi) } : m) })} />
              </div>
            ))}
            <button type="button" onClick={() => onChange({ ...value, modules: modules.map((m, j) => j === i ? { ...m, bullets: [...(m.bullets ?? []), ""] } : m) })}
              className="text-xs text-brand-600 hover:underline">+ Add Bullet</button>
          </div>
        </div>
      ))}
      <AddBtn label="Add Module" onClick={() => onChange({ ...value, modules: [...modules, { title: "" }] })} />
    </Panel>
  );
}

export function T4PricingSectionPanel({
  value, onChange, panel,
}: {
  value: { bonusLabel?: string; bonusText?: string; savingsText?: string; ctaText?: string; paymentBadge1?: string; paymentBadge2?: string; paymentBadge3?: string };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  const set = (k: keyof typeof value, v: string) => onChange({ ...value, [k]: v });
  return (
    <Panel title="Pricing Section Extras" {...panel}>
      <p className="text-xs text-gray-400">Price and original price come from the main pricing fields above.</p>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl text="Bonus Label Badge" /><input value={value.bonusLabel ?? ""} onChange={(e) => set("bonusLabel", e.target.value)} placeholder="EXCLUSIVE BONUS" className={inputCls} /></div>
        <div><Lbl text="Savings Text" /><input value={value.savingsText ?? ""} onChange={(e) => set("savingsText", e.target.value)} placeholder="আপনি সাশ্রয় করছেন ৳X,XXX" className={inputCls} /></div>
      </div>
      <div><Lbl text="Bonus Text" /><input value={value.bonusText ?? ""} onChange={(e) => set("bonusText", e.target.value)} placeholder="Free lifetime access + bonus resources" className={inputCls} /></div>
      <div><Lbl text="CTA Button Text" /><input value={value.ctaText ?? ""} onChange={(e) => set("ctaText", e.target.value)} placeholder="এখনই ভর্তি হন" className={inputCls} /></div>
      <div className="grid grid-cols-3 gap-2">
        <div><Lbl text="Payment Badge 1" /><input value={value.paymentBadge1 ?? ""} onChange={(e) => set("paymentBadge1", e.target.value)} placeholder="bKash" className={inputCls} /></div>
        <div><Lbl text="Payment Badge 2" /><input value={value.paymentBadge2 ?? ""} onChange={(e) => set("paymentBadge2", e.target.value)} placeholder="Nagad" className={inputCls} /></div>
        <div><Lbl text="Payment Badge 3" /><input value={value.paymentBadge3 ?? ""} onChange={(e) => set("paymentBadge3", e.target.value)} placeholder="Card / Bank" className={inputCls} /></div>
      </div>
    </Panel>
  );
}

export function T4SupportSectionPanel({
  value, onChange, panel,
}: {
  value: { title?: string; content?: string; instructorImage?: string };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  return (
    <Panel title="Support Section (Dark Purple)" {...panel}>
      <div><Lbl text="Section Title" /><input value={value.title ?? ""} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="আর সাপোর্ট?" className={inputCls} /></div>
      <div><Lbl text="Content / Paragraphs" /><textarea value={value.content ?? ""} onChange={(e) => onChange({ ...value, content: e.target.value })} rows={4} placeholder="আমরা সর্বদা পাশে আছি..." className={`${inputCls} resize-none`} /></div>
      <div><Lbl text="Instructor Image URL" /><ImagePickerField value={value.instructorImage ?? ""} onChange={(v) => onChange({ ...value, instructorImage: v })} /></div>
    </Panel>
  );
}

export function T4CountdownBannerPanel({
  value, onChange, panel,
}: {
  value: { text?: string; ctaText?: string };
  onChange: (v: typeof value) => void;
  panel?: PanelReorder;
}) {
  return (
    <Panel title="Countdown Banner" {...panel}>
      <p className="text-xs text-gray-400">The countdown timer uses the Countdown End date from main pricing fields.</p>
      <div><Lbl text="Banner Text" /><input value={value.text ?? ""} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder="Early Bird Offer শেষ হতে আর বাকি" className={inputCls} /></div>
      <div><Lbl text="CTA Button Text" /><input value={value.ctaText ?? ""} onChange={(e) => onChange({ ...value, ctaText: e.target.value })} placeholder="এখনই সুযোগ নিন" className={inputCls} /></div>
    </Panel>
  );
}

export function BundleCoursesPanel({
  selectedIds,
  onChange,
  excludeCourseId,
}: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  excludeCourseId?: number;
}) {
  const [courses, setCourses] = useState<RecordedCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRecordedCoursesAction().then((res) => {
      if (res.success) {
        const filtered = excludeCourseId ? res.data.filter((c) => c.id !== excludeCourseId) : res.data;
        setCourses(filtered);
      }
      setLoading(false);
    });
  }, [excludeCourseId]);

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <Panel title="Bundle — Included Recorded Courses">
      <p className="text-xs text-gray-400">
        Select the recorded courses that students will get access to when they purchase this bundle.
      </p>
      {!loading && courses.length > 0 && (
        <div className="relative mt-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course by title..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}
      {loading && <p className="text-xs text-gray-400 py-2">Loading courses…</p>}
      {!loading && courses.length === 0 && (
        <p className="text-xs text-yellow-400 py-2">No published recorded courses found.</p>
      )}
      <div className="flex flex-col gap-2 mt-2 max-h-64 overflow-y-auto pr-1">
        {(() => {
          const q = search.trim().toLowerCase();
          const filtered = q ? courses.filter((c) => c.title.toLowerCase().includes(q)) : courses;
          if (filtered.length === 0 && courses.length > 0) {
            return <p className="text-xs text-gray-400 py-2 text-center">No courses match &quot;{search}&quot;</p>;
          }
          return filtered.map((course) => {
          const selected = selectedIds.includes(course.id);
          return (
            <label
              key={course.id}
              className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                selected ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(course.id)}
                className="accent-brand-600 w-4 h-4 shrink-0"
              />
              {course.thumbnail ? (
                <img src={course.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0 text-base border border-gray-200">📚</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={course.title}>{course.title}</p>
                <p className="text-xs text-gray-500">
                  {parseFloat(course.price) === 0 ? "বিনামূল্যে" : `৳${Number(course.price).toLocaleString("en-BD")}`}
                </p>
              </div>
              {selected && (
                <span className="text-xs text-brand-600 font-medium shrink-0">
                  #{selectedIds.indexOf(course.id) + 1}
                </span>
              )}
            </label>
          );
          });
        })()}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-black mt-2">
          {selectedIds.length} course(s) selected for this bundle. — Total: ৳{(() => {
            let t = 0;
            selectedIds.forEach((id) => {
              const c = courses.find((x) => x.id === id);
              if (c) t += parseFloat(c.price) || 0;
            });
            return t.toLocaleString("en-BD");
          })()}
        </p>
      )}
    </Panel>
  );
}
