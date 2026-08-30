import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Enrollment } from "@/features/courses/api/enrollments";

function fmt(v: number) {
  return `৳${v.toLocaleString("en-BD")}`;
}

export function DuePaymentBanner({ enrollments }: { enrollments: Enrollment[] }) {
  const dueCourses = enrollments.filter((e) => e.paymentStatus === "due" || e.paymentStatus === "partial");
  if (dueCourses.length === 0) return null;

  const totalDue = dueCourses.reduce((sum, e) => sum + Number(e.dueAmount), 0);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
          <AlertTriangle className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
            You have {fmt(totalDue)} due across {dueCourses.length} course{dueCourses.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-2 space-y-1">
            {dueCourses.map((e) => (
              <li
                key={`${e.courseType}-${e.id}`}
                className="flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-400"
              >
                <span className="truncate">{e.courseTitle}</span>
                <span className="shrink-0 font-medium">
                  Paid {fmt(Number(e.totalPaid))} of {fmt(Number(e.feeAmount ?? 0))} · Due {fmt(Number(e.dueAmount))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Please clear your due balance to avoid interruption to your course access.{" "}
            <Link href="/contact" className="font-semibold underline underline-offset-2">
              Contact support
            </Link>{" "}
            to complete your payment.
          </p>
        </div>
      </div>
    </div>
  );
}
