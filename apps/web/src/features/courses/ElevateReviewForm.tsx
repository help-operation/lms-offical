"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { coursesApiBrowser } from "@/features/courses/api/browser";

interface ElevateReviewFormProps {
  courseId: number;
  isEnrolled: boolean;
  isLoggedIn: boolean;
}

export function ElevateReviewForm({ courseId, isEnrolled, isLoggedIn }: ElevateReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn || !isEnrolled) return null;
  if (success) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center dark:border-brand-900/50 dark:bg-brand-500/10">
        <p className="font-medium text-brand-700 dark:text-brand-400">Thank you for your review!</p>
        <p className="mt-1 text-sm text-brand-600 dark:text-brand-400">Your feedback helps other students.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      await coursesApiBrowser.submitReview(courseId, {
        rating,
        comment: comment.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
      <div className="p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Write a Review</h3>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star rating */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  className="focus:outline-none"
                  aria-label={`${s} star${s > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      s <= (hovered || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Comment <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-brand-100 bg-brand-50/30 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-brand-500/30"
              placeholder="Share your experience with this course..."
            />
          </div>

          <button
            type="submit"
            disabled={isPending || rating === 0}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
