"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollmentsApiBrowser as enrollmentsApi } from "@/features/courses/api/enrollments/browser";
import { authApiBrowser } from "@/features/auth/api/browser";
import { trackAddToCart } from "@/shared/utils/dataLayer";

interface EnrollButtonProps {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  price: number;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  /** Admin-configurable button labels (global settings). */
  labels?: {
    enroll: string;
    enrollFree: string;
    continueLearning: string;
  };
}

const DEFAULT_LABELS = {
  enroll: "Enroll Now",
  enrollFree: "Enroll for Free",
  continueLearning: "Continue Learning",
};

export function EnrollButton({
  courseId,
  courseTitle,
  courseSlug,
  price,
  isEnrolled,
  isLoggedIn,
  labels = DEFAULT_LABELS,
}: EnrollButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isEnrolled) {
    return (
      <a
        href={`/learn/${courseSlug}`}
        className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl border-0 transition-colors"
      >
        {labels.continueLearning}
      </a>
    );
  }

  function handleEnroll() {
    trackAddToCart({ item_id: String(courseId), item_name: courseTitle, price });

    // Paid courses → checkout (which supports guest purchase via the leads
    // flow; logged-in users get the standard order flow). No login gate here.
    if (price > 0) {
      router.push(`/checkout/${courseSlug}`);
      return;
    }

    // Free enrollment needs a user account to attach the enrollment to.
    if (!isLoggedIn) {
      router.push(`/login?redirect=/courses/${courseSlug}`);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await enrollmentsApi.enroll(courseId);
        // Re-issue the token so the GUEST→STUDENT upgrade takes effect now.
        await authApiBrowser.refresh().catch(() => {});
        router.push(`/learn/${courseSlug}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Enrollment failed");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={isPending}
        className="block w-full text-center bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl border-0 transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation"
      >
        {isPending ? "Enrolling…" : price === 0 ? labels.enrollFree : labels.enroll}
      </button>
      {error && <p className="text-sm text-red-600 mt-2 text-center dark:text-red-400">{error}</p>}
    </div>
  );
}
