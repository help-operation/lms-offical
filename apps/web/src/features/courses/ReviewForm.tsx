"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { coursesApiBrowser } from "@/features/courses/api/browser";

interface ReviewFormProps {
  courseId: number;
  isEnrolled: boolean;
  isLoggedIn: boolean;
}

export function ReviewForm({ courseId, isEnrolled, isLoggedIn }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn || !isEnrolled) return null;
  if (success) {
    return (
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 text-center dark:bg-brand-500/10 dark:border-brand-500/30">
        <p className="text-brand-700 font-medium dark:text-brand-400">Thank you for your review!</p>
        <p className="text-brand-600 text-sm mt-1 dark:text-brand-400">Your feedback helps other students.</p>
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
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit review. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-bold text-gray-900 mb-4 dark:text-white">Write a Review</h3>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Your Rating</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
            Comment <span className="text-gray-400 font-normal dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            placeholder="Share your experience with this course..."
          />
        </div>

        <button
          type="submit"
          disabled={isPending || rating === 0}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
