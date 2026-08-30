"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Star, Loader2, Save, Film, ImageIcon, Link2 } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import {
  createCuratedReviewAction,
  updateCuratedReviewAction,
} from "@/features/courses/actions/reviews.actions";
import type { CourseReview, ReviewType } from "@/features/courses/api/reviews";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import type { MediaFile } from "@/features/media/types";

interface Props {
  courseId: number;
  /** When set, modal opens in edit mode pre-filled with this review. */
  review?: CourseReview | null;
  onClose: () => void;
  onSaved: () => void;
}

type FormState = {
  reviewType: ReviewType;
  displayName: string;
  displayRole: string;
  displayAvatar: string;
  rating: number;
  comment: string;
  videoUrl: string;
  videoThumbnail: string;
};

const EMPTY: FormState = {
  reviewType: "text",
  displayName: "",
  displayRole: "",
  displayAvatar: "",
  rating: 5,
  comment: "",
  videoUrl: "",
  videoThumbnail: "",
};

export function CuratedReviewModal({ courseId, review, onClose, onSaved }: Props) {
  const [f, setF] = useState<FormState>(() =>
    review
      ? {
          reviewType: review.reviewType,
          displayName: review.displayName ?? "",
          displayRole: review.displayRole ?? "",
          displayAvatar: review.displayAvatar ?? "",
          rating: review.rating,
          comment: review.comment ?? "",
          videoUrl: review.videoUrl ?? "",
          videoThumbnail: review.videoThumbnail ?? "",
        }
      : EMPTY,
  );
  const [isPending, startTransition] = useTransition();
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showThumbPicker, setShowThumbPicker] = useState(false);

  // ESC + body scroll lock
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, isPending]);

  const isEdit = !!review;

  function validate(): string | null {
    if (!f.displayName.trim()) return "Display name is required";
    if (f.rating < 1 || f.rating > 5) return "Rating must be 1–5";
    if (f.reviewType === "text" && !f.comment.trim())
      return "Text reviews need a comment";
    if (f.reviewType === "video" && !f.videoUrl.trim())
      return "Video reviews need a video URL";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    startTransition(async () => {
      const payload = {
        rating: f.rating,
        reviewType: f.reviewType,
        displayName: f.displayName.trim(),
        displayRole: f.displayRole.trim() || null,
        displayAvatar: f.displayAvatar.trim() || null,
        comment: f.reviewType === "text" ? f.comment.trim() : null,
        videoUrl: f.reviewType === "video" ? f.videoUrl.trim() : null,
        videoThumbnail:
          f.reviewType === "video" ? f.videoThumbnail.trim() || null : null,
      };
      const res = isEdit
        ? await updateCuratedReviewAction(review!.id, payload)
        : await createCuratedReviewAction(courseId, payload);
      if (res.success) {
        toast.success(isEdit ? "Review updated" : "Review added");
        onSaved();
        onClose();
      } else {
        toast.error(res.message ?? "Failed to save");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={isPending ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit curated review" : "Add curated review"}
          </h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Review type */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <TypeButton
                active={f.reviewType === "text"}
                onClick={() => setF((p) => ({ ...p, reviewType: "text" }))}
                disabled={isPending}
              >
                📝 Text review
              </TypeButton>
              <TypeButton
                active={f.reviewType === "video"}
                onClick={() => setF((p) => ({ ...p, reviewType: "video" }))}
                disabled={isPending}
              >
                ▶ Video review
              </TypeButton>
            </div>
          </div>

          {/* Person info */}
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Reviewer
            </p>
            <Field label="Display name *">
              <input
                value={f.displayName}
                onChange={(e) => setF((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="e.g. Mizanur Rahman"
                className="input-base"
                disabled={isPending}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role / Title (optional)">
                <input
                  value={f.displayRole}
                  onChange={(e) => setF((p) => ({ ...p, displayRole: e.target.value }))}
                  placeholder="e.g. HR & Admin, Teacher, Student"
                  className="input-base"
                  disabled={isPending}
                />
              </Field>
              <Field label="Avatar (optional)">
                <ImagePickerField
                  value={f.displayAvatar}
                  onChange={(v) => setF((p) => ({ ...p, displayAvatar: v }))}
                  disabled={isPending}
                  previewClassName="w-12 h-12 rounded-full object-cover border border-gray-100 mt-1"
                />
              </Field>
            </div>
          </div>

          {/* Rating */}
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Rating
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setF((p) => ({ ...p, rating: n }))}
                  disabled={isPending}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className="p-1"
                >
                  <Star
                    className={`h-7 w-7 ${
                      n <= f.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm font-semibold text-gray-700">
                {f.rating} / 5
              </span>
            </div>
          </div>

          {/* Content — text OR video */}
          {f.reviewType === "text" ? (
            <Field label="Review text *">
              <textarea
                rows={5}
                value={f.comment}
                onChange={(e) => setF((p) => ({ ...p, comment: e.target.value }))}
                placeholder="What did this student say?"
                className="input-base resize-none"
                disabled={isPending}
              />
            </Field>
          ) : (
            <>
              {/* Video URL */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Video URL *</label>
                <div className="flex gap-2">
                  <input
                    value={f.videoUrl}
                    onChange={(e) => setF((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=... or direct .mp4 link"
                    className="input-base flex-1"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowVideoPicker(true)}
                    disabled={isPending}
                    title="Pick from Media Library"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <Film size={13} /> Library
                  </button>
                  {f.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setF((p) => ({ ...p, videoUrl: "" }))}
                      disabled={isPending}
                      className="flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-2.5 text-red-400 hover:bg-red-100 transition-colors shrink-0"
                      title="Clear video URL"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Link2 size={10} />
                  Supports YouTube, Vimeo, or direct video file URL
                </p>
              </div>

              {/* Thumbnail */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Thumbnail image <span className="text-gray-400 font-normal">(optional — auto-detected for YouTube)</span>
                </label>

                {/* Thumbnail preview */}
                {f.videoThumbnail && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.videoThumbnail}
                      alt="Thumbnail preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setF((p) => ({ ...p, videoThumbnail: "" }))}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-gray-600 hover:bg-white shadow transition-colors"
                      title="Remove thumbnail"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {!f.videoThumbnail && (
                  <div className="flex gap-2">
                    <input
                      value={f.videoThumbnail}
                      onChange={(e) => setF((p) => ({ ...p, videoThumbnail: e.target.value }))}
                      placeholder="https://... (image URL)"
                      className="input-base flex-1"
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowThumbPicker(true)}
                      disabled={isPending}
                      title="Pick from Media Library"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <ImageIcon size={13} /> Library
                    </button>
                  </div>
                )}

                {f.videoThumbnail && (
                  <button
                    type="button"
                    onClick={() => setShowThumbPicker(true)}
                    disabled={isPending}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Change image
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isEdit ? "Save Changes" : "Add Review"}
          </button>
        </div>
      </div>

      {/* Media pickers — rendered outside the modal panel so z-index stacks correctly */}
      {showVideoPicker && (
        <MediaLibraryModal
          filterType="video"
          onClose={() => setShowVideoPicker(false)}
          onSelect={(file: MediaFile) => {
            setF((p) => ({ ...p, videoUrl: file.url }));
            setShowVideoPicker(false);
          }}
        />
      )}
      {showThumbPicker && (
        <MediaLibraryModal
          filterType="image"
          onClose={() => setShowThumbPicker(false)}
          onSelect={(file: MediaFile) => {
            setF((p) => ({ ...p, videoThumbnail: file.url }));
            setShowThumbPicker(false);
          }}
        />
      )}
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

function TypeButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
