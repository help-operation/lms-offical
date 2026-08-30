"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Film, Link2, Plus, Trash2, GripVertical, Loader2, X, ShieldCheck, User, Star, EyeOff } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  updateCourseAction,
  updateCourseThumbnailAction,
  updateCourseDetailPageAction,
  publishCourseAction,
  unpublishCourseAction,
  deleteCourseAction,
  restoreCourseAction,
  scheduleCourseAction,
  unscheduleCourseAction,
} from "@/features/courses/actions/courses.actions";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import type { InstructorCourse, Category, PreviewSlide } from "@/features/courses/api";
import type { MediaFile } from "@/features/media/types";
import { toast } from "@repo/ui/sonner";

const LEVELS: { value: string; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "beginner_to_advanced", label: "Beginner to Advanced" },
];
const LANGUAGES = ["Bangla", "English", "Hindi"];

interface CourseFormProps {
  course: InstructorCourse;
  categories: Category[];
  onSave?: () => void;
  onDelete?: () => void;
  role?: string;
  onFieldChange?: (key: string, value: any) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectSource(url: string): PreviewSlide["source"] {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "external";
}

export function CourseForm({ course, categories, onSave, onDelete, role, onFieldChange }: CourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Basic fields ──────────────────────────────────────────────────────────
  const [fields, setFields] = useState({
    title: course.title,
    slug: (course as any).slug ?? "",
    shortDescription: course.shortDescription ?? "",
    description: course.description ?? "",
    categoryId: course.categoryId ? String(course.categoryId) : "",
    level: course.level,
    language: course.language,
    price: course.price,
    discountPrice: course.discountPrice ?? "",
  });
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [showSlugWarning, setShowSlugWarning] = useState(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(course.isFeatured);
  const [isUnlisted, setIsUnlisted] = useState<boolean>((course as any).isUnlisted ?? false);
  const [showBadge, setShowBadge] = useState<boolean>(course.showBadge ?? true);
  const [publishAs, setPublishAs]   = useState<"admin" | "teacher">(course.publishAs ?? "admin");
  const [requireSequential, setRequireSequential] = useState<boolean>(course.requireSequentialProgress ?? false);

  // ── Access duration ──────────────────────────────────────────────────────
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState<boolean>(course.hasLifetimeAccess ?? true);
  const [accessDurationDays, setAccessDurationDays] = useState<string>(
    course.accessDurationDays ? String(course.accessDurationDays) : "365",
  );
  const [manualStudentCount, setManualStudentCount] = useState<string>(
    course.manualStudentCount != null ? String(course.manualStudentCount) : "",
  );
  const [rating, setRatingState] = useState<string>(
    course.rating ? String(course.rating) : "",
  );
  const [ratingCount, setRatingCountState] = useState<string>(
    course.ratingCount ? String(course.ratingCount) : "",
  );
  const [ratingSource, setRatingSourceState] = useState<string>(
    course.ratingSource || "auto",
  );

  function setRating(v: string) {
    setRatingState(v);
    if (onFieldChange) onFieldChange("rating", v);
  }
  function setRatingCount(v: string) {
    setRatingCountState(v);
    if (onFieldChange) onFieldChange("ratingCount", v);
  }
  function setRatingSource(v: string) {
    setRatingSourceState(v);
    if (onFieldChange) onFieldChange("ratingSource", v);
  }
  const [accessPreset, setAccessPreset] = useState<string>(() => {
    const d = course.accessDurationDays;
    if (!d) return "365";
    if (d === 90 || d === 180 || d === 365) return String(d);
    return "custom";
  });

  // ── Thumbnail ─────────────────────────────────────────────────────────────
  const [thumbnail, setThumbnail]             = useState<string | null>(course.thumbnail);
  const [showThumbPicker, setShowThumbPicker] = useState(false);
  const [thumbSaving, startThumbSave]         = useTransition();
  const [thumbUrl, setThumbUrl]               = useState("");

  // ── Social Proof Image ──────────────────────────────────────────────────
  const [socialProofImage, setSocialProofImage] = useState<string | null>(course.socialProofImage ?? null);
  const [socialProofImageUrl, setSocialProofImageUrl] = useState("");
  const [showSocialProofPicker, setShowSocialProofPicker] = useState(false);

  function pickSocialProofImage(file: MediaFile) {
    setShowSocialProofPicker(false);
    setSocialProofImage(file.url);
    if (onFieldChange) onFieldChange("socialProofImage", file.url);
  }

  function pickThumbnail(file: MediaFile) {
    setShowThumbPicker(false);
    startThumbSave(async () => {
      const res = await updateCourseThumbnailAction(course.id, file.url);
      if (res.success) {
        setThumbnail(file.url);
        if (onFieldChange) {
          onFieldChange("thumbnail", file.url);
        }
        toast.success("Thumbnail updated");
      } else {
        setError(res.message ?? "Failed to save thumbnail");
        toast.error(res.message ?? "Failed to save thumbnail");
      }
    });
  }

  function setThumbByUrl() {
    const url = thumbUrl.trim();
    if (!url) return;
    startThumbSave(async () => {
      const res = await updateCourseThumbnailAction(course.id, url);
      if (res.success) {
        setThumbnail(url);
        setThumbUrl("");
        if (onFieldChange) {
          onFieldChange("thumbnail", url);
        }
        toast.success("Thumbnail updated");
      } else {
        setError(res.message ?? "Failed to save thumbnail");
        toast.error(res.message ?? "Failed to save thumbnail");
      }
    });
  }

  function removeThumbnail() {
    startThumbSave(async () => {
      const res = await updateCourseThumbnailAction(course.id, null);
      if (res.success) {
        setThumbnail(null);
        if (onFieldChange) {
          onFieldChange("thumbnail", null);
        }
        toast.success("Thumbnail removed");
      } else {
        setError(res.message ?? "Failed to remove thumbnail");
        toast.error(res.message ?? "Failed to remove thumbnail");
      }
    });
  }

  // ── Preview Slides ────────────────────────────────────────────────────────
  const [slides, setSlides] = useState<PreviewSlide[]>(course.previewSlides ?? []);
  const [showSlidesPicker, setShowSlidesPicker] = useState(false);
  const [extUrl,   setExtUrl]   = useState("");
  const [extType,  setExtType]  = useState<"image" | "video">("video");
  const [slidesSaving, startSlidesSave] = useTransition();
  const [slidesSaved, setSlidesSaved]   = useState(false);

  function addFromMedia(file: MediaFile) {
    const slide: PreviewSlide = {
      type:   file.type === "image" ? "image" : "video",
      url:    file.url,
      source: "r2",
    };
    setSlides((prev) => [...prev, slide]);
    setSlidesSaved(false);
  }

  function addExternal() {
    const url = extUrl.trim();
    if (!url) return;
    const slide: PreviewSlide = {
      type:   extType,
      url,
      source: detectSource(url),
    };
    setSlides((prev) => [...prev, slide]);
    setExtUrl("");
    setSlidesSaved(false);
  }

  function removeSlide(idx: number) {
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setSlidesSaved(false);
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
    setSlidesSaved(false);
  }

  function saveSlides() {
    startSlidesSave(async () => {
      const res = await updateCourseDetailPageAction(course.id, { previewSlides: slides });
      if (res.success) {
        setSlidesSaved(true);
        toast.success("Preview slides saved");
        if (!onSave) router.refresh();
      } else {
        setError(res.message ?? "Failed to save slides");
        toast.error(res.message ?? "Failed to save slides");
      }
    });
  }

  // ── Basic save ────────────────────────────────────────────────────────────
  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (onFieldChange) {
      onFieldChange(key, value);
    }
  }

  function setFeatured(value: boolean) {
    setIsFeatured(value);
    setSaved(false);
  }

  function setBadge(value: boolean) {
    setShowBadge(value);
    setSaved(false);
  }

  function setSequential(value: boolean) {
    setRequireSequential(value);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCourseAction(course.id, {
        title:            fields.title,
        slug:             fields.slug || undefined,
        shortDescription: fields.shortDescription || undefined,
        description:      fields.description || undefined,
        categoryId:       fields.categoryId ? Number(fields.categoryId) : undefined,
        level:            fields.level,
        language:         fields.language,
        price:            fields.price,
        discountPrice:    fields.discountPrice || undefined,
        isFeatured,
        isUnlisted,
        showBadge,
        publishAs,
        requireSequentialProgress: requireSequential,
        hasLifetimeAccess,
        accessDurationDays: hasLifetimeAccess ? undefined : (Number(accessDurationDays) || undefined),
        manualStudentCount: manualStudentCount !== "" ? Number(manualStudentCount) : null,
        rating: rating !== "" ? Number(rating) : undefined,
        ratingCount: ratingCount !== "" ? Number(ratingCount) : undefined,
        ratingSource: ratingSource as 'auto' | 'static',
        socialProofImage: socialProofImage || null,
      });
      if (!res?.success) {
        setError(res?.message ?? "Failed to save");
        toast.error(res?.message ?? "Failed to save changes");
      } else {
        toast.success("Changes saved");
        if (onSave) {
          onSave();
        } else {
          setSaved(true);
          router.refresh();
        }
      }
    });
  }

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const res = await publishCourseAction(course.id);
      if (!res?.success) {
        setError(res?.message ?? "Failed");
        toast.error(res?.message ?? "Failed to publish course");
      } else {
        toast.success("Course published");
        if (onSave) onSave();
        else router.refresh();
      }
    });
  }

  function handleUnpublish() {
    setError(null);
    startTransition(async () => {
      const res = await unpublishCourseAction(course.id);
      if (!res?.success) {
        setError(res?.message ?? "Failed");
        toast.error(res?.message ?? "Failed to unpublish course");
      } else {
        toast.success("Course unpublished");
        if (onSave) onSave();
        else router.refresh();
      }
    });
  }

  function handleDelete() {
    setShowDeleteConfirm(false);
    startTransition(async () => {
      const res = await deleteCourseAction(course.id);
      if (!res?.success) {
        setError(res?.message ?? "Failed to move to Trash");
        toast.error(res?.message ?? "Failed to move course to Trash");
      } else {
        toast.success("Course moved to Trash");
        if (onDelete) onDelete();
        else router.push("/admin/courses");
      }
    });
  }

  function handleRestore() {
    startTransition(async () => {
      const res = await restoreCourseAction(course.id);
      if (!res?.success) {
        toast.error(res?.message ?? "Failed to restore course");
      } else {
        toast.success("Course restored to Draft");
        router.refresh();
      }
    });
  }

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  function handleSchedule() {
    if (!scheduleAt) return;
    startTransition(async () => {
      const res = await scheduleCourseAction(course.id, new Date(scheduleAt).toISOString());
      if (!res?.success) {
        toast.error(res?.message ?? "Failed to schedule course");
      } else {
        toast.success("Course scheduled");
        setShowScheduleModal(false);
        router.refresh();
      }
    });
  }

  function handleUnschedule() {
    startTransition(async () => {
      const res = await unscheduleCourseAction(course.id);
      if (!res?.success) {
        toast.error(res?.message ?? "Failed to unschedule course");
      } else {
        toast.success("Schedule cancelled — course reverted to Draft");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={showDeleteConfirm}
        title="Move to Trash"
        message={<>Move <strong>{course.title}</strong> to Trash? It will be hidden from students and can be restored later from the course list&apos;s Trash filter.</>}
        confirmLabel="Yes, Move to Trash"
        variant="danger"
        isPending={isPending}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        open={showScheduleModal}
        title="Schedule Publish"
        message={
          <div className="space-y-2">
            <p>Choose when <strong>{course.title}</strong> should automatically go live.</p>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </div>
        }
        confirmLabel="Schedule"
        variant="success"
        isPending={isPending}
        onConfirm={handleSchedule}
        onClose={() => setShowScheduleModal(false)}
      />
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {saved && !onSave && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">Changes saved.</div>
      )}

      {/* ── Course Info ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Course Info</h2>
              <p className="text-[11px] text-gray-400">Basic course details and settings</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title — full width */}
          <Field label="Title">
            <input
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              className="input-base"
              placeholder="e.g. Complete Web Development Bootcamp"
              disabled={isPending}
            />
          </Field>

          <ConfirmModal
            open={showSlugWarning}
            title="Change URL?"
            message={<>If you change this slug, the old URL <strong>/courses/{fields.slug}</strong> will stop working (404). Anyone with the old link, Google indexing and social shares will be affected and SEO may drop. No redirect will be created. Are you sure you want to edit?</>}
            confirmLabel="Yes, Edit Slug"
            variant="danger"
            onConfirm={() => { setShowSlugWarning(false); setIsSlugEditing(true); }}
            onClose={() => setShowSlugWarning(false)}
          />
          <Field label="Slug">
            <div className="flex items-center gap-2">
              <input
                value={fields.slug}
                onChange={(e) => {
                  const slugified = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/[\s]+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");
                  set("slug", slugified);
                }}
                className={`input-base flex-1 ${!isSlugEditing ? "bg-gray-50 text-gray-500" : ""}`}
                placeholder="auto-generated-from-title"
                disabled={isPending || !isSlugEditing}
              />
              {!isSlugEditing ? (
                <button
                  type="button"
                  onClick={() => setShowSlugWarning(true)}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-brand-600"
                  title="Edit slug"
                  disabled={isPending}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSlugEditing(false)}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  title="Lock slug"
                >
                  Lock
                </button>
              )}
            </div>
            {fields.slug && (
              <a
                href={`${process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001"}/courses/${fields.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
              >
                Preview: /courses/{fields.slug} ↗
              </a>
            )}
          </Field>

          {/* Short Description — full width */}
          <Field label="Short Description">
            <textarea
              value={fields.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              className="input-base min-h-[80px] resize-y"
              placeholder="Brief description shown in the course hero section"
              disabled={isPending}
            />
          </Field>

          {/* Category / Level / Language / Manual Count — 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Field label="Category">
              <select
                value={fields.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="input-base"
                disabled={isPending}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Level">
              <select
                value={fields.level}
                onChange={(e) => set("level", e.target.value)}
                className="input-base"
                disabled={isPending}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Language">
              <select
                value={fields.language}
                onChange={(e) => set("language", e.target.value)}
                className="input-base"
                disabled={isPending}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>

            <Field label="Student Count">
              <input
                type="number"
                min={0}
                placeholder="Leave empty for real count"
                value={manualStudentCount}
                onChange={(e) => setManualStudentCount(e.target.value)}
                className="input-base"
                disabled={isPending}
              />
            </Field>

            <div className="flex gap-2">
              <Field label="Rating">
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="e.g. 4.9"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="input-base"
                  disabled={isPending}
                />
              </Field>
              <Field label="Rating Count">
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 348"
                  value={ratingCount}
                  onChange={(e) => setRatingCount(e.target.value)}
                  className="input-base"
                  disabled={isPending}
                />
              </Field>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Rating Source:</span>
              <button
                type="button"
                onClick={() => setRatingSource(ratingSource === "static" ? "auto" : "static")}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  ratingSource === "static" ? "bg-brand-600" : "bg-gray-300"
                }`}
                disabled={isPending}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    ratingSource === "static" ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="font-medium text-gray-700">
                {ratingSource === "static" ? "Static" : "Auto"}
              </span>
              {ratingSource === "static" && rating && ratingCount && (
                <span className="text-brand-600">→ {rating} ★ ({ratingCount} ratings)</span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Toggles — clean card style */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Options</p>

            {/* Featured */}
            <label className={`group flex items-center gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              isFeatured
                ? "border-amber-300 bg-amber-50/60 shadow-sm shadow-amber-100"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  disabled={isPending}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white transition-all peer-checked:border-amber-500 peer-checked:bg-amber-500">
                  {isFeatured && (
                    <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isFeatured ? "text-amber-900" : "text-gray-800 group-hover:text-gray-900"}`}>Featured Course</p>
                <p className={`text-[11px] leading-relaxed ${isFeatured ? "text-amber-700" : "text-gray-400"}`}>
                  Shows in &ldquo;Top Courses&rdquo; carousel on the homepage
                </p>
              </div>
              <Star className={`h-4 w-4 shrink-0 transition-colors ${isFeatured ? "text-amber-500" : "text-gray-300 group-hover:text-gray-400"}`} />
            </label>

            {/* Unlisted */}
            <label className={`group flex items-center gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              isUnlisted
                ? "border-gray-400 bg-gray-50 shadow-sm shadow-gray-100"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isUnlisted}
                  onChange={(e) => { setIsUnlisted(e.target.checked); onFieldChange?.("isUnlisted", e.target.checked); }}
                  disabled={isPending}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white transition-all peer-checked:border-gray-500 peer-checked:bg-gray-500">
                  {isUnlisted && (
                    <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isUnlisted ? "text-gray-700" : "text-gray-800 group-hover:text-gray-900"}`}>Unlisted Course</p>
                <p className={`text-[11px] leading-relaxed ${isUnlisted ? "text-gray-500" : "text-gray-400"}`}>
                  Hidden from course listings — only accessible via direct URL
                </p>
              </div>
              <EyeOff className={`h-4 w-4 shrink-0 transition-colors ${isUnlisted ? "text-gray-400" : "text-gray-300 group-hover:text-gray-400"}`} />
            </label>

            {/* Show Badge */}
            <label className={`group flex items-center gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              showBadge
                ? "border-brand-300 bg-brand-50/60 shadow-sm shadow-brand-100"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) => setBadge(e.target.checked)}
                  disabled={isPending}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white transition-all peer-checked:border-brand-500 peer-checked:bg-brand-500">
                  {showBadge && (
                    <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${showBadge ? "text-brand-900" : "text-gray-800 group-hover:text-gray-900"}`}>Show Course Badge</p>
                <p className={`text-[11px] leading-relaxed ${showBadge ? "text-brand-700" : "text-gray-400"}`}>
                  Displays &ldquo;Recorded&rdquo; or &ldquo;Live&rdquo; badge on course cards
                </p>
              </div>
              <ShieldCheck className={`h-4 w-4 shrink-0 transition-colors ${showBadge ? "text-brand-500" : "text-gray-300 group-hover:text-gray-400"}`} />
            </label>

            {/* Sequential Learning */}
            <label className={`group flex items-center gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              requireSequential
                ? "border-violet-300 bg-violet-50/60 shadow-sm shadow-violet-100"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={requireSequential}
                  onChange={(e) => setSequential(e.target.checked)}
                  disabled={isPending}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white transition-all peer-checked:border-violet-500 peer-checked:bg-violet-500">
                  {requireSequential && (
                    <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${requireSequential ? "text-violet-900" : "text-gray-800 group-hover:text-gray-900"}`}>Sequential Learning</p>
                <p className={`text-[11px] leading-relaxed ${requireSequential ? "text-violet-700" : "text-gray-400"}`}>
                  Students must complete lessons in order to progress
                </p>
              </div>
              <svg className={`h-4 w-4 shrink-0 transition-colors ${requireSequential ? "text-violet-500" : "text-gray-300 group-hover:text-gray-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
            </label>

            {/* Lifetime Access */}
            <div className={`rounded-xl border p-3.5 transition-all duration-200 ${
              hasLifetimeAccess
                ? "border-emerald-300 bg-emerald-50/60 shadow-sm shadow-emerald-100"
                : "border-gray-200"
            }`}>
              <label className="flex items-center gap-3.5 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={hasLifetimeAccess}
                    onChange={(e) => setHasLifetimeAccess(e.target.checked)}
                    disabled={isPending}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-500">
                    {hasLifetimeAccess && (
                      <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${hasLifetimeAccess ? "text-emerald-900" : "text-gray-800"}`}>Lifetime Access</p>
                  <p className={`text-[11px] leading-relaxed ${hasLifetimeAccess ? "text-emerald-700" : "text-gray-400"}`}>
                    If disabled, access expires after the specified duration
                  </p>
                </div>
                <svg className={`h-4 w-4 shrink-0 transition-colors ${hasLifetimeAccess ? "text-emerald-500" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </label>

              {!hasLifetimeAccess && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5 pl-8.5">
                  <select
                    value={accessPreset}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAccessPreset(v);
                      if (v !== "custom") setAccessDurationDays(v);
                    }}
                    disabled={isPending}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  >
                    <option value="90">3 months</option>
                    <option value="180">6 months</option>
                    <option value="365">1 year</option>
                    <option value="custom">Custom</option>
                  </select>
                  {accessPreset === "custom" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={accessDurationDays}
                        onChange={(e) => setAccessDurationDays(e.target.value)}
                        disabled={isPending}
                        className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      />
                      <span className="text-xs text-gray-500">days</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Publish As */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Published By</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Choose whose name appears as the instructor on the course page.
              </p>
            </div>

            {/* Admin */}
            <button
              type="button"
              onClick={() => { setPublishAs("admin"); setSaved(false); }}
              disabled={isPending}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                publishAs === "admin"
                  ? "border-indigo-300 bg-indigo-50/60 shadow-sm shadow-indigo-100"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                publishAs === "admin" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
              }`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${publishAs === "admin" ? "text-indigo-900" : "text-gray-800"}`}>
                  Admin Identity
                </p>
                <p className="text-[11px] text-gray-400">Show as &ldquo;Super Admin&rdquo;</p>
              </div>
              <div className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                publishAs === "admin" ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
              }`}>
                {publishAs === "admin" && (
                  <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </div>
            </button>

            {/* Teacher */}
            <button
              type="button"
              onClick={() => { setPublishAs("teacher"); setSaved(false); }}
              disabled={isPending}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                publishAs === "teacher"
                  ? "border-teal-300 bg-teal-50/60 shadow-sm shadow-teal-100"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                publishAs === "teacher" ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-400"
              }`}>
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${publishAs === "teacher" ? "text-teal-900" : "text-gray-800"}`}>
                  Teacher Profile
                </p>
                <p className="text-[11px] text-gray-400">
                  Use name from{" "}
                  <span className="underline decoration-teal-400 underline-offset-2">Profile Settings</span>
                </p>
              </div>
              <div className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                publishAs === "teacher" ? "border-teal-500 bg-teal-500" : "border-gray-300"
              }`}>
                {publishAs === "teacher" && (
                  <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Price (৳)">
            <input
              type="number"
              min="0"
              value={fields.price}
              onChange={(e) => set("price", e.target.value)}
              className="input-base"
              placeholder="0 for free"
              disabled={isPending}
            />
          </Field>
          <Field label="Discount Price (৳)">
            <input
              type="number"
              min="0"
              value={fields.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              className="input-base"
              placeholder="Leave empty if no discount"
              disabled={isPending}
            />
          </Field>
        </div>
      </div>

      {/* ── Course Thumbnail ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Course Thumbnail</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Shown on course cards and as the Open Graph image. Pick from your media library or paste a direct URL.
          </p>
        </div>

        {thumbnail ? (
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="relative h-28 w-48 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnail} alt="Course thumbnail" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col gap-2 pt-1 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setShowThumbPicker(true)}
                disabled={thumbSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Change image
              </button>
              <button
                type="button"
                onClick={removeThumbnail}
                disabled={thumbSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {thumbSaving
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <X className="h-3.5 w-3.5" />}
                Remove
              </button>
              {/* Manual URL */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="url"
                  value={thumbUrl}
                  onChange={(e) => setThumbUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setThumbByUrl(); } }}
                  disabled={thumbSaving}
                  placeholder="or paste image URL…"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={setThumbByUrl}
                  disabled={thumbSaving || !thumbUrl.trim()}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowThumbPicker(true)}
              disabled={thumbSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 transition-colors disabled:opacity-50"
            >
              {thumbSaving
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <ImageIcon className="h-5 w-5" />}
              {thumbSaving ? "Saving…" : "Select from Media Library"}
            </button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">or paste a URL</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={thumbUrl}
                onChange={(e) => setThumbUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setThumbByUrl(); } }}
                disabled={thumbSaving}
                placeholder="https://example.com/thumbnail.jpg"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={setThumbByUrl}
                disabled={thumbSaving || !thumbUrl.trim()}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Social Proof Image ────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Social Proof Image</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Single image with company logos / trust badges. Shown below the hero section on the course page.
          </p>
        </div>

        {socialProofImage ? (
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-64 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={socialProofImage} alt="Social proof" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col gap-2 pt-1 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setShowSocialProofPicker(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Change image
              </button>
              <button
                type="button"
                onClick={() => { setSocialProofImage(null); onFieldChange?.("socialProofImage", null); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="url"
                  value={socialProofImageUrl}
                  onChange={(e) => setSocialProofImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setSocialProofImage(socialProofImageUrl); onFieldChange?.("socialProofImage", socialProofImageUrl || null); setSocialProofImageUrl(""); } }}
                  placeholder="or paste image URL…"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="button"
                  onClick={() => { setSocialProofImage(socialProofImageUrl); onFieldChange?.("socialProofImage", socialProofImageUrl || null); setSocialProofImageUrl(""); }}
                  disabled={!socialProofImageUrl.trim()}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowSocialProofPicker(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              Select from Media Library
            </button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">or paste a URL</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={socialProofImageUrl}
                onChange={(e) => setSocialProofImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setSocialProofImage(socialProofImageUrl); onFieldChange?.("socialProofImage", socialProofImageUrl || null); setSocialProofImageUrl(""); } }}
                placeholder="https://example.com/image.png"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={() => { setSocialProofImage(socialProofImageUrl); onFieldChange?.("socialProofImage", socialProofImageUrl || null); setSocialProofImageUrl(""); }}
                disabled={!socialProofImageUrl.trim()}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Preview Slides (Enroll Now Card Carousel) ────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Preview Slides</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Images and videos shown in the &ldquo;Enroll Now&rdquo; card carousel on the course page.
            Supports R2-hosted files, YouTube, Vimeo, or any direct video/image URL.
          </p>
        </div>

        {/* Slide list */}
        {slides.length > 0 && (
          <div className="space-y-2">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />

                {/* Thumb / icon */}
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  {slide.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-700">{slide.url}</p>
                  <p className="text-[10px] text-gray-400 capitalize">
                    {slide.type} · {slide.source ?? "external"}
                  </p>
                </div>

                {/* Up / down / remove */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 1)}
                    disabled={idx === slides.length - 1}
                    className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(idx)}
                    className="rounded p-1 text-red-400 hover:text-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSlidesPicker(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add from Media Library
          </button>
        </div>

        {/* External URL input */}
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 shrink-0 text-gray-400" />
          <select
            value={extType}
            onChange={(e) => setExtType(e.target.value as "image" | "video")}
            className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>
          <input
            type="url"
            value={extUrl}
            onChange={(e) => setExtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addExternal()}
            placeholder="https://youtube.com/watch?v=… or https://example.com/video.mp4"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={addExternal}
            disabled={!extUrl.trim()}
            className="shrink-0 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Save slides */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveSlides}
            disabled={slidesSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {slidesSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {slidesSaving ? "Saving…" : "Save Slides"}
          </button>
          {slidesSaved && <span className="text-sm text-green-700">Slides saved.</span>}
        </div>
      </div>

      {/* ── Media Library modals ─────────────────────────────────────────── */}
      {showThumbPicker && (
        <MediaLibraryModal
          filterType="image"
          onSelect={pickThumbnail}
          onClose={() => setShowThumbPicker(false)}
        />
      )}

      {showSocialProofPicker && (
        <MediaLibraryModal
          filterType="image"
          onSelect={pickSocialProofImage}
          onClose={() => setShowSocialProofPicker(false)}
        />
      )}

      {showSlidesPicker && (
        <MediaLibraryModal
          multiple
          onSelect={addFromMedia}
          onClose={() => setShowSlidesPicker(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
