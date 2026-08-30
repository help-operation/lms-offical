"use client";

/**
 * "Detail Page" tab — edits the per-course content that drives the public
 * /courses/[slug] page beyond the basics (title/price/etc.).
 *
 * Backed by new columns on the `courses` table (see schema.ts):
 *   facilities, targetAudience, certificatePerks, faq,
 *   quizCount, exerciseCount, hasLifetimeAccess, supportPhone, paymentInstructions.
 *
 * Empty/null values fall back to sensible defaults on the public page,
 * so brand-new courses still look complete.
 *
 * UX: the long per-section forms used to be one big scroll. Now each row in
 * "Section Order & Visibility" is clickable and opens a focused modal holding
 * just that section's fields (sections whose content lives elsewhere show an
 * info note instead). Edits are held in state and committed by the single
 * "Save Detail Page" button.
 */

import { useState, useTransition } from "react";
import {
  Plus, X, ArrowUp, ArrowDown, Eye, EyeOff, Film, ImageIcon, Link2,
  Pencil, Info,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { updateCourseDetailPageAction } from "@/features/courses/actions/courses.actions";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import type {
  InstructorCourse,
  CourseFacility,
  CourseFaqItem,
  DetailPageSection,
} from "@/features/courses/api";
import type { MediaFile } from "@/features/media/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type DetailPageContent = {
  learningOutcomes: string;
  requirements: string;
  quizCount: number;
  exerciseCount: number;
  hasLifetimeAccess: boolean;
  targetAudience: string;
  facilities: CourseFacility[];
  certificatePerks: string[];
  certificateImage: string;
  faq: CourseFaqItem[];
  supportPhone: string;
  paymentInstructions: string;
  paymentGuideVideo: string;
  detailPageSections: DetailPageSection[];
};

// Canonical body-section list with admin-friendly labels. Keep in sync with
// the matching SECTION_DEFINITIONS on the web side.
const SECTION_DEFINITIONS: { id: string; label: string }[] = [
  { id: "instructor",     label: "Instructor" },
  { id: "structure",      label: "Course Structure" },
  { id: "learn",          label: "Learning Outcomes" },
  { id: "details",        label: "Description" },
  { id: "content",        label: "Curriculum Preview" },
  { id: "certificate",    label: "Course Certificate" },
  { id: "reviews",        label: "Student Reviews" },
  { id: "requirements",   label: "Requirements" },
  { id: "payment",        label: "Payment Options" },
  { id: "faq",            label: "FAQ" },
  { id: "more-questions", label: "Support & Contact" },
];

// Mastery template only needs curriculum section
const MASTERY_SECTION_DEFINITIONS: { id: string; label: string }[] = [
  { id: "content", label: "Curriculum Preview" },
];

function getSectionDefinitions(template: string): { id: string; label: string }[] {
  return template === "2" ? MASTERY_SECTION_DEFINITIONS : SECTION_DEFINITIONS;
}

// Which sections have editable fields on THIS tab (open a field editor in the
// modal). Everything else opens an info note pointing to where it's edited.
const EDITOR_SECTIONS = new Set([
  "learn",
  "structure",
  "certificate",
  "requirements",
  "payment",
  "faq",
  "more-questions",
]);

// For non-editor sections: where the content actually comes from.
const SECTION_INFO: Record<string, string> = {
  instructor:
    "The instructor card is pulled from the assigned instructor's profile. Manage it under People → Teachers.",
  details:
    "“Course details” comes from the Description field on the Basics tab.",
  content:
    "The content preview is built from the course curriculum. Use the “Curriculum” button at the top of this editor to add modules and lessons.",
  reviews:
    "Reviews are managed in the “Reviews” tab of this editor.",
};

const DEFAULT_SECTION_ORDER: DetailPageSection[] = SECTION_DEFINITIONS.map(
  (s) => ({ id: s.id, enabled: true }),
);

const MASTERY_DEFAULT_SECTION_ORDER: DetailPageSection[] = MASTERY_SECTION_DEFINITIONS.map(
  (s) => ({ id: s.id, enabled: true }),
);

function getDefaultSectionOrder(template: string): DetailPageSection[] {
  return template === "2" ? MASTERY_DEFAULT_SECTION_ORDER : DEFAULT_SECTION_ORDER;
}

// Merge saved list with the canonical definition: keeps saved order &
// enabled state where present, appends any new section types at the end
// (enabled by default) so the admin doesn't lose options when we add new
// sections in the future.
function mergeSections(saved: DetailPageSection[] | null | undefined, template: string): DetailPageSection[] {
  const definitions = getSectionDefinitions(template);
  const validIds = new Set(definitions.map((s) => s.id));
  const savedList = Array.isArray(saved) && saved.length > 0 ? saved : getDefaultSectionOrder(template);
  const savedIds = new Set(savedList.map((s) => s.id));
  const kept = savedList.filter((s) => validIds.has(s.id));
  const missing = definitions
    .filter((s) => !savedIds.has(s.id))
    .map((s) => ({ id: s.id, enabled: true }));
  return [...kept, ...missing];
}

function sectionLabel(id: string): string {
  return SECTION_DEFINITIONS.find((s) => s.id === id)?.label ?? id;
}

// ─── Defaults (only used when a fresh course has no data saved yet) ───────────

const FACILITY_ICONS = [
  "play-circle",
  "file-text",
  "check-circle",
  "book-open",
  "graduation-cap",
  "award",
  "video",
  "code",
  "clock",
  "users",
];

const STARTER_FACILITIES: CourseFacility[] = [
  { icon: "play-circle",  title: "Video lectures",     desc: "Recorded lessons you can watch anytime, at your own pace." },
  { icon: "file-text",    title: "Lecture sheets",     desc: "Chapter-wise notes and sheets after every lesson." },
  { icon: "check-circle", title: "Quiz sets",          desc: "Self-assessment quizzes to test what you've learned." },
  { icon: "book-open",    title: "Practice exercises", desc: "Hands-on exercises you can do any time to build real skill." },
];

const STARTER_PERKS = [
  "Add it to your CV / resume",
  "Share it directly on your LinkedIn profile",
  "Share it on Facebook with one click",
];

const STARTER_FAQ: CourseFaqItem[] = [
  { question: "How do I buy this course?",                  answer: "Click 'Buy this course' → 'Get started' → log in with your phone or email → choose a payment method → complete payment." },
  { question: "How do I pay with bKash?",                   answer: "Select bKash at checkout, complete the payment from your bKash app, and your enrollment activates automatically." },
  { question: "How do I report a technical problem?",       answer: "Use the community group, one-to-one support, or the Contact page." },
  { question: "Can I cancel a course enrollment?",          answer: "Yes, within the refund window. Contact support with your order details." },
  { question: "How do I start the course after buying?",    answer: "After payment, click 'Start course' or open your dashboard — all enrolled courses live there." },
];

// Builds initial form state from the loaded course. If the course has empty
// arrays / null strings (i.e. never edited), populate with starter defaults so
// admins see useful content to tweak rather than a blank canvas.
function initialFromCourse(course: InstructorCourse): DetailPageContent {
  return {
    learningOutcomes:  course.learningOutcomes ?? "",
    requirements:      course.requirements     ?? "",
    quizCount:         course.quizCount        ?? 0,
    exerciseCount:     course.exerciseCount    ?? 0,
    hasLifetimeAccess: course.hasLifetimeAccess ?? true,
    targetAudience:    course.targetAudience   ?? "",
    facilities:        Array.isArray(course.facilities)        && course.facilities.length        > 0 ? course.facilities        : STARTER_FACILITIES,
    certificatePerks:  Array.isArray(course.certificatePerks)  && course.certificatePerks.length  > 0 ? course.certificatePerks  : STARTER_PERKS,
    certificateImage:  course.certificateImage  ?? "",
    faq:               Array.isArray(course.faq)               && course.faq.length               > 0 ? course.faq               : STARTER_FAQ,
    supportPhone:        course.supportPhone        ?? "",
    paymentInstructions: course.paymentInstructions ?? "",
    paymentGuideVideo:   course.paymentGuideVideo   ?? "",
    detailPageSections:  mergeSections(course.detailPageSections, course.template),
  };
}

type EditorProps = {
  c: DetailPageContent;
  patch: <K extends keyof DetailPageContent>(k: K, v: DetailPageContent[K]) => void;
  isPending: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  course: InstructorCourse;
}

export function CourseDetailPageForm({ course }: Props) {
  const [c, setC] = useState<DetailPageContent>(() => initialFromCourse(course));
  const [isPending, startTransition] = useTransition();
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showCertPicker,  setShowCertPicker]  = useState(false);
  const [activeSection,   setActiveSection]   = useState<string | null>(null);

  function patch<K extends keyof DetailPageContent>(k: K, v: DetailPageContent[K]) {
    setC((prev) => ({ ...prev, [k]: v }));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateCourseDetailPageAction(course.id, {
        learningOutcomes:  c.learningOutcomes.trim() || null,
        requirements:      c.requirements.trim() || null,
        quizCount:         c.quizCount,
        exerciseCount:     c.exerciseCount,
        hasLifetimeAccess: c.hasLifetimeAccess,
        targetAudience:    c.targetAudience.trim() || null,
        facilities:        c.facilities,
        certificatePerks:  c.certificatePerks.filter((p) => p.trim().length > 0),
        certificateImage:  c.certificateImage.trim() || null,
        faq:               c.faq.filter((q) => q.question.trim().length > 0),
        supportPhone:        c.supportPhone.trim() || null,
        paymentInstructions: c.paymentInstructions.trim() || null,
        paymentGuideVideo:   c.paymentGuideVideo.trim() || null,
        detailPageSections:  c.detailPageSections,
      });
      if (res.success) {
        toast.success("Detail page saved");
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  function moveSection(index: number, dir: "up" | "down") {
    const swapIdx = dir === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= c.detailPageSections.length) return;
    const next = [...c.detailPageSections];
    [next[index], next[swapIdx]] = [next[swapIdx]!, next[index]!];
    patch("detailPageSections", next);
  }

  function toggleSection(index: number) {
    const next = [...c.detailPageSections];
    next[index] = { ...next[index]!, enabled: !next[index]!.enabled };
    patch("detailPageSections", next);
  }

  const enabledCount = c.detailPageSections.filter((s) => s.enabled).length;
  const hiddenCount  = c.detailPageSections.length - enabledCount;

  return (
    <div className="space-y-5">
      {/* ── Section Order & Visibility ───────────────────────────────────── */}
      <Panel
        title={
          <div className="flex items-center justify-between gap-3">
            <span>Page Sections</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-green-50 text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {enabledCount} shown
              </span>
              {hiddenCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {hiddenCount} hidden
                </span>
              )}
            </div>
          </div>
        }
      >
        <p className="text-xs text-gray-500 -mt-2 mb-2">
          Drag to reorder sections on the course page. Click a section name to edit its content. Toggle visibility with the eye icon.
        </p>
        <div className="space-y-2">
          {c.detailPageSections.map((s, i) => {
            const isFirst = i === 0;
            const isLast = i === c.detailPageSections.length - 1;
            const hasEditor = EDITOR_SECTIONS.has(s.id);
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  s.enabled
                    ? "border-gray-200 bg-white"
                    : "border-dashed border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => moveSection(i, "up")}
                    disabled={isFirst || isPending}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveSection(i, "down")}
                    disabled={isLast || isPending}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setActiveSection(s.id)}
                  className="flex-1 min-w-0 text-left group flex items-center gap-2"
                  title="Edit this section"
                >
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${s.enabled ? "text-gray-900" : "text-gray-400"}`}>
                      {sectionLabel(s.id)}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 text-gray-300 group-hover:text-indigo-500 transition-colors">
                    {hasEditor ? <Pencil size={13} /> : <Info size={13} />}
                  </span>
                </button>
                <button
                  onClick={() => toggleSection(i)}
                  disabled={isPending}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    s.enabled
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  aria-label={s.enabled ? "Hide section" : "Show section"}
                  title={s.enabled ? "Hide section" : "Show section"}
                >
                  {s.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ── Purchase sidebar & audience (not part of the reorderable list) ─── */}
      <Panel title="Purchase sidebar &amp; audience">
        <p className="text-xs text-gray-500 -mt-2 mb-1">
          Customize the purchase sidebar content shown to students on the course page.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Total quizzes">
              <input
                type="number"
                min="0"
                value={c.quizCount}
                onChange={(e) => patch("quizCount", parseInt(e.target.value) || 0)}
                className="input-base"
                disabled={isPending}
              />
              <p className="text-[11px] text-gray-400 mt-1">Displayed in the &ldquo;What&rsquo;s in this course&rdquo; sidebar.</p>
            </Field>
            <Field label="Total exercises">
              <input
                type="number"
                min="0"
                value={c.exerciseCount}
                onChange={(e) => patch("exerciseCount", parseInt(e.target.value) || 0)}
                className="input-base"
                disabled={isPending}
              />
              <p className="text-[11px] text-gray-400 mt-1">Displayed in the &ldquo;What&rsquo;s in this course&rdquo; sidebar.</p>
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={c.hasLifetimeAccess}
              onChange={(e) => patch("hasLifetimeAccess", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={isPending}
            />
            <span className="text-sm text-gray-700">Show &ldquo;Lifetime course access&rdquo; in purchase sidebar</span>
          </label>
        </div>
        <Field label="Who is this course for?">
          <textarea
            rows={3}
            value={c.targetAudience}
            onChange={(e) => patch("targetAudience", e.target.value)}
            className="input-base resize-none"
            placeholder="Describe your ideal student — their skill level, goals, and what they'll gain from this course."
            disabled={isPending}
          />
        </Field>
      </Panel>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "Saving…" : "Save Detail Page"}
        </button>
      </div>

      {/* ── Per-section edit modal ────────────────────────────────────────── */}
      {activeSection && (
        <SectionModal
          sectionId={activeSection}
          c={c}
          patch={patch}
          isPending={isPending}
          onClose={() => setActiveSection(null)}
          onPickImage={() => setShowCertPicker(true)}
          onPickVideo={() => setShowVideoPicker(true)}
          variant="contained"
        />
      )}

      {/* Media pickers — rendered after the section modal so they stack on top */}
      {showCertPicker && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file: MediaFile) => {
            patch("certificateImage", file.url);
            setShowCertPicker(false);
          }}
          onClose={() => setShowCertPicker(false)}
        />
      )}
      {showVideoPicker && (
        <MediaLibraryModal
          filterType="video"
          onSelect={(file: MediaFile) => {
            patch("paymentGuideVideo", file.url);
            setShowVideoPicker(false);
          }}
          onClose={() => setShowVideoPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Section modal ──────────────────────────────────────────────────────────

function SectionModal({
  sectionId,
  c,
  patch,
  isPending,
  onClose,
  onPickImage,
  onPickVideo,
  variant = "modal",
}: EditorProps & {
  sectionId: string;
  onClose: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  /**
   * "modal" (default): full-viewport overlay blocking the whole page.
   * "contained": overlay scoped to the nearest positioned ancestor (its column),
   * so the rest of the page stays interactive. No dark scrim.
   */
  variant?: "modal" | "contained";
}) {
  const hasEditor = EDITOR_SECTIONS.has(sectionId);
  const contained = variant === "contained";

  return (
    <div
      className={`${
        contained ? "absolute items-start pt-6" : "fixed items-center bg-black/40 backdrop-blur-sm"
      } inset-0 z-50 flex justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-2xl flex flex-col max-h-[88vh] ${
          contained ? "shadow-xl border border-gray-200" : "shadow-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{sectionLabel(sectionId)}</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{sectionId}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {sectionId === "learn"          && <LearnEditor         c={c} patch={patch} isPending={isPending} />}
          {sectionId === "requirements"   && <RequirementsEditor  c={c} patch={patch} isPending={isPending} />}
          {sectionId === "structure"      && <FacilitiesEditor    c={c} patch={patch} isPending={isPending} />}
          {sectionId === "certificate"    && <CertificateEditor   c={c} patch={patch} isPending={isPending} onPickImage={onPickImage} />}
          {sectionId === "payment"        && <PaymentEditor       c={c} patch={patch} isPending={isPending} onPickVideo={onPickVideo} />}
          {sectionId === "more-questions" && <MoreQuestionsEditor c={c} patch={patch} isPending={isPending} />}
          {sectionId === "faq"            && <FaqEditor           c={c} patch={patch} isPending={isPending} />}
          {!hasEditor && (
            <div className="flex items-start gap-3 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
              <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-800 leading-relaxed">
                {SECTION_INFO[sectionId] ??
                  "This section renders automatically — there are no extra fields to edit here. Use the eye toggle to show or hide it."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400">
            {hasEditor ? "Changes apply when you click “Save Detail Page”." : ""}
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section field editors ──────────────────────────────────────────────────

function LearnEditor({ c, patch, isPending }: EditorProps) {
  return (
    <Field label="What you'll learn">
      <textarea
        value={c.learningOutcomes}
        onChange={(e) => patch("learningOutcomes", e.target.value)}
        rows={6}
        className="input-base resize-none"
        placeholder={"Enter each learning outcome on a new line\n• Python basics\n• OOP concepts"}
        disabled={isPending}
      />
      <p className="text-xs text-gray-400 mt-1">Enter each outcome on a separate line. Bullet points (•) are optional.</p>
    </Field>
  );
}

function RequirementsEditor({ c, patch, isPending }: EditorProps) {
  return (
    <Field label="Requirements">
      <textarea
        value={c.requirements}
        onChange={(e) => patch("requirements", e.target.value)}
        rows={5}
        className="input-base resize-none"
        placeholder={"Enter each requirement on a new line\n• Basic computer skills\n• Internet access"}
        disabled={isPending}
      />
      <p className="text-xs text-gray-400 mt-1">Enter each requirement on a separate line. Bullet points (•) are optional.</p>
    </Field>
  );
}

function FacilitiesEditor({ c, patch, isPending }: EditorProps) {
  return (
    <div className="space-y-3">
      {c.facilities.map((f, i) => (
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-3 relative">
          <button
            onClick={() => patch("facilities", c.facilities.filter((_, j) => j !== i))}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            aria-label="Remove facility"
            disabled={isPending}
          >
            <X size={14} />
          </button>
          <div className="grid grid-cols-[140px_1fr] gap-3 pr-6">
            <Field label="Icon">
              <select
                value={f.icon}
                onChange={(e) => {
                  const nf = [...c.facilities];
                  nf[i] = { ...f, icon: e.target.value };
                  patch("facilities", nf);
                }}
                className="input-base"
                disabled={isPending}
              >
                {FACILITY_ICONS.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                value={f.title}
                onChange={(e) => {
                  const nf = [...c.facilities];
                  nf[i] = { ...f, title: e.target.value };
                  patch("facilities", nf);
                }}
                className="input-base"
                disabled={isPending}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={2}
              value={f.desc}
              onChange={(e) => {
                const nf = [...c.facilities];
                nf[i] = { ...f, desc: e.target.value };
                patch("facilities", nf);
              }}
              className="input-base resize-none"
              disabled={isPending}
            />
          </Field>
        </div>
      ))}
      <AddButton
        onClick={() => patch("facilities", [...c.facilities, { icon: "play-circle", title: "", desc: "" }])}
        disabled={isPending}
      >
        Add Facility
      </AddButton>
    </div>
  );
}

function CertificateEditor({ c, patch, isPending, onPickImage }: EditorProps & { onPickImage: () => void }) {
  return (
    <div className="space-y-4">
      {/* Certificate Image */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Certificate Image</label>
        <p className="text-xs text-gray-400">
          Replaces the placeholder card on the course page. Paste an external URL or pick from Media Library.
        </p>
        {c.certificateImage ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.certificateImage}
              alt="Certificate preview"
              className="w-full rounded-xl border border-gray-200 object-contain max-h-48"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPickImage}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Change
              </button>
              <button
                type="button"
                onClick={() => patch("certificateImage", "")}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                value={c.certificateImage}
                onChange={(e) => patch("certificateImage", e.target.value)}
                className="input-base w-full pl-9"
                placeholder="https://example.com/certificate.jpg"
                disabled={isPending}
              />
            </div>
            <button
              type="button"
              onClick={onPickImage}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Library
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        {c.certificatePerks.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={p}
              onChange={(e) => {
                const np = [...c.certificatePerks];
                np[i] = e.target.value;
                patch("certificatePerks", np);
              }}
              className="input-base"
              placeholder="e.g. Add it to your CV"
              disabled={isPending}
            />
            <button
              onClick={() => patch("certificatePerks", c.certificatePerks.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-500 px-2"
              aria-label="Remove perk"
              disabled={isPending}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <AddButton
          onClick={() => patch("certificatePerks", [...c.certificatePerks, ""])}
          disabled={isPending}
        >
          Add Perk
        </AddButton>
      </div>
    </div>
  );
}

function PaymentEditor({ c, patch, isPending, onPickVideo }: EditorProps & { onPickVideo: () => void }) {
  return (
    <div className="space-y-3">
      <Field label="&ldquo;How to pay&rdquo; instructions">
        <textarea
          rows={3}
          value={c.paymentInstructions}
          onChange={(e) => patch("paymentInstructions", e.target.value)}
          className="input-base resize-none"
          placeholder="Leave blank to use the default — &ldquo;Pay securely with bKash, Nagad, ...&rdquo;"
          disabled={isPending}
        />
      </Field>

      {/* Payment Guide Video */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Payment Guide Video</label>
        <p className="text-xs text-gray-400">
          Shown when students click &ldquo;See the payment guide&rdquo; on the course page.
          Paste a YouTube / Vimeo / MP4 URL, or pick from your Media Library.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={c.paymentGuideVideo}
              onChange={(e) => patch("paymentGuideVideo", e.target.value)}
              className="input-base w-full pl-9"
              placeholder="https://youtube.com/watch?v=… or https://…/video.mp4"
              disabled={isPending}
            />
          </div>
          <button
            type="button"
            onClick={onPickVideo}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <Film className="h-3.5 w-3.5" />
            Library
          </button>
          {c.paymentGuideVideo && (
            <button
              type="button"
              onClick={() => patch("paymentGuideVideo", "")}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MoreQuestionsEditor({ c, patch, isPending }: EditorProps) {
  return (
    <Field label="Support phone (purchase sidebar &amp; bottom call-out)">
      <input
        value={c.supportPhone}
        onChange={(e) => patch("supportPhone", e.target.value)}
        className="input-base"
        placeholder="e.g. 16910"
        disabled={isPending}
      />
      <p className="text-xs text-gray-400 mt-1.5">
        Leave blank to use the site default. This number powers the &ldquo;Have more questions?&rdquo;
        call-to-action and the purchase sidebar.
      </p>
    </Field>
  );
}

function FaqEditor({ c, patch, isPending }: EditorProps) {
  return (
    <div className="space-y-3">
      {c.faq.map((q, i) => (
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-3 relative space-y-2">
          <button
            onClick={() => patch("faq", c.faq.filter((_, j) => j !== i))}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            aria-label="Remove FAQ"
            disabled={isPending}
          >
            <X size={14} />
          </button>
          <div className="pr-6 space-y-2">
            <Field label="Question">
              <input
                value={q.question}
                onChange={(e) => {
                  const nq = [...c.faq];
                  nq[i] = { ...q, question: e.target.value };
                  patch("faq", nq);
                }}
                className="input-base"
                disabled={isPending}
              />
            </Field>
            <Field label="Answer">
              <textarea
                rows={2}
                value={q.answer}
                onChange={(e) => {
                  const nq = [...c.faq];
                  nq[i] = { ...q, answer: e.target.value };
                  patch("faq", nq);
                }}
                className="input-base resize-none"
                disabled={isPending}
              />
            </Field>
          </div>
        </div>
      ))}
      <AddButton
        onClick={() => patch("faq", [...c.faq, { question: "", answer: "" }])}
        disabled={isPending}
      >
        Add Question
      </AddButton>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function AddButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
    >
      <Plus size={13} /> {children}
    </button>
  );
}
