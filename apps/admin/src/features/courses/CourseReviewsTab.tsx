"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Star, Play, Loader2, User } from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  listCourseReviewsAction,
  deleteReviewAction,
} from "@/features/courses/actions/reviews.actions";
import type {
  CourseReview,
  CourseReviewsResponse,
} from "@/features/courses/api/reviews";
import type { InstructorCourse } from "@/features/courses/api";
import { CuratedReviewModal } from "./CuratedReviewModal";

interface Props {
  course: InstructorCourse;
}

export function CourseReviewsTab({ course }: Props) {
  const [data, setData] = useState<CourseReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseReview | null>(null);
  const [isDeleting, startDelete] = useTransition();

  async function refresh() {
    setLoading(true);
    const res = await listCourseReviewsAction(course.id);
    if (res.success) {
      setData(res.data);
    } else {
      toast.error(res.message ?? "Failed to load reviews");
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  function handleDelete(r: CourseReview) {
    setDeleteTarget(null);
    startDelete(async () => {
      const res = await deleteReviewAction(r.id);
      if (res.success) {
        toast.success("Review deleted");
        refresh();
      } else {
        toast.error(res.message ?? "Failed to delete");
      }
    });
  }

  const reviews = data?.reviews ?? [];
  const videos = reviews.filter((r) => r.reviewType === "video");
  const texts = reviews.filter((r) => r.reviewType === "text");

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Review"
        message={
          deleteTarget
            ? <>Delete review from <strong>
                {deleteTarget.source === "admin_curated"
                  ? deleteTarget.displayName ?? "curated review"
                  : `${deleteTarget.userFirstName ?? ""} ${deleteTarget.userLastName ?? ""}`.trim() || "student"}
              </strong>? This cannot be undone.</>
            : ""
        }
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isDeleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header / stats / add button */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900">Course Reviews</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Organic student reviews (auto-submitted) + admin-curated reviews
              (manual). Both feed the course&rsquo;s overall star rating.
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2"
          >
            <Plus size={14} /> Add Review
          </button>
        </div>

        {data && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Average rating" value={data.avg.toFixed(1)} suffix="★" highlight />
            <Stat label="Total reviews" value={String(data.total)} />
            <Stat
              label="Curated / Organic"
              value={`${reviews.filter((r) => r.source === "admin_curated").length} / ${reviews.filter((r) => r.source === "student").length}`}
            />
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-400">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Star className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No reviews yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Click &ldquo;Add Review&rdquo; to seed some testimonials, or wait for enrolled
            students to submit their own.
          </p>
        </div>
      ) : (
        <>
          {videos.length > 0 && (
            <Section title={`Video reviews (${videos.length})`}>
              {videos.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onEdit={() => { setEditing(r); setModalOpen(true); }}
                  onDelete={() => setDeleteTarget(r)}
                  busy={isDeleting}
                />
              ))}
            </Section>
          )}
          {texts.length > 0 && (
            <Section title={`Text reviews (${texts.length})`}>
              {texts.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onEdit={() => { setEditing(r); setModalOpen(true); }}
                  onDelete={() => setDeleteTarget(r)}
                  busy={isDeleting}
                />
              ))}
            </Section>
          )}
        </>
      )}

      {modalOpen && (
        <CuratedReviewModal
          courseId={course.id}
          review={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => refresh()}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-amber-500" : "text-gray-900"}`}>
        {value}
        {suffix && <span className="text-sm ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600">{title}</p>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function ReviewRow({
  review,
  onEdit,
  onDelete,
  busy,
}: {
  review: CourseReview;
  onEdit: () => void;
  onDelete: () => void;
  busy?: boolean;
}) {
  const isCurated = review.source === "admin_curated";
  const name = isCurated
    ? review.displayName ?? "—"
    : `${review.userFirstName ?? ""} ${review.userLastName ?? ""}`.trim() || "Anonymous student";
  const role = isCurated ? review.displayRole ?? "" : "Enrolled student";
  const avatar = isCurated ? review.displayAvatar : review.userAvatar;

  return (
    <div className="p-4 flex items-start gap-3">
      {/* Avatar */}
      <div className="shrink-0">
        {avatar ? (
          <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <User size={16} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          {isCurated ? (
            <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
              Curated
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              Organic
            </span>
          )}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
        </div>
        {role && <p className="mt-0.5 text-xs text-gray-500">{role}</p>}

        {review.reviewType === "video" ? (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600">
            <Play size={11} /> Video — {review.videoUrl}
          </div>
        ) : (
          review.comment && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{review.comment}</p>
          )
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        {isCurated && (
          <button
            onClick={onEdit}
            disabled={busy}
            className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={busy}
          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
