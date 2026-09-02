"use client";

import { X, EnvelopeSimple, DeviceMobile, Calendar, Clock, Books, CreditCard } from "@phosphor-icons/react";
import type { EnrichedStudent } from "./types";

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const PAYMENT_COLOR: Record<string, string> = {
  paid: "text-green-600",
  partial: "text-amber-600",
  due: "text-red-600",
};

const ENROLLMENT_COLOR: Record<string, string> = {
  active: "text-blue-600",
  completed: "text-teal-600",
  suspended: "text-red-600",
  refunded: "text-gray-600",
  none: "text-gray-500",
};

export function StudentDetailsDrawer({
  student,
  onClose,
  onSendMessage,
}: {
  student: EnrichedStudent;
  onClose: () => void;
  onSendMessage: (student: EnrichedStudent) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-gray-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Student Details</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500">ID: {student.id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Profile */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
              {student.email && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <EnvelopeSimple size={12} /> {student.email}
                </p>
              )}
              {student.phone && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <DeviceMobile size={12} /> {student.phone}
                </p>
              )}
            </div>
            <span className={`ml-auto shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${
              student.activeStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              {student.activeStatus}
            </span>
          </div>

          {/* Enrollment */}
          <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              <Books size={13} weight="fill" /> Enrollment
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Course</span>
                <span className="font-medium text-gray-900 dark:text-white">{student.courseName}</span>
              </div>
              {student.batchName && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Batch</span>
                  <span className="font-medium text-gray-900 dark:text-white">{student.batchName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Type</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{student.courseType === "none" ? "—" : student.courseType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Status</span>
                <span className={`font-medium capitalize ${ENROLLMENT_COLOR[student.enrollmentStatus] ?? ""}`}>{student.enrollmentStatus}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              <CreditCard size={13} weight="fill" /> Payment
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Status</span>
                <span className={`font-medium capitalize ${PAYMENT_COLOR[student.paymentStatus] ?? ""}`}>{student.paymentStatus}</span>
              </div>
              {student.dueAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Due Amount</span>
                  <span className="font-medium text-red-600">BDT {student.dueAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              <Clock size={13} weight="fill" /> Activity
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Registered</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmtDate(student.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Last Login</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmtDateTime(student.lastLoginAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onSendMessage(student)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <DeviceMobile size={14} weight="fill" /> Send Message
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
