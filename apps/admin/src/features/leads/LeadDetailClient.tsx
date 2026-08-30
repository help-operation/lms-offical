"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, Trash2, Mail, Phone, BookOpen, Tag, ExternalLink, GraduationCap, UserPlus } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { toast } from "@repo/ui/sonner";
import {
  updateLeadAction,
  deleteLeadAction,
} from "@/features/leads/actions/leads.actions";
import type { Lead, LeadStatus } from "@/features/leads/api";
import { ManualEnrollModal } from "@/features/enrollments/ManualEnrollModal";
import type { EnrollLeadContext } from "@/features/enrollments/types";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props {
  lead: Lead;
}

const STATUSES: { key: "pending" | "complete"; label: string; bg: string; text: string }[] = [
  { key: "pending",  label: "Pending",  bg: "bg-amber-100", text: "text-amber-700" },
  { key: "complete", label: "Complete", bg: "bg-green-100", text: "text-green-700" },
];

export function LeadDetailClient({ lead }: Props) {
  const router = useRouter();
  const { formatDateTime } = useLocalization();
  const initialStatus: "pending" | "complete" = lead.status === "complete" ? "complete" : "pending";
  const [status, setStatus] = useState<"pending" | "complete">(initialStatus);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [enroll, setEnroll] = useState<{ mode: "enroll" | "account" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const leadCtx: EnrollLeadContext = {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    orderPaid: lead.orderPaid,
    courseIds: lead.courseIds,
  };

  const dirty = status !== lead.status || (notes ?? "") !== (lead.notes ?? "");

  function handleSave() {
    startTransition(async () => {
      const res = await updateLeadAction(lead.id, {
        status,
        notes: notes.trim() ? notes : null,
      });
      if (res.success) toast.success("Lead updated");
      else toast.error(res.message ?? "Failed to update");
    });
  }

  function handleDelete() {
    setShowDeleteConfirm(false);
    startTransition(async () => {
      const res = await deleteLeadAction(lead.id);
      if (res.success) {
        toast.success("Lead deleted");
        router.push("/admin/leads");
      } else {
        toast.error(res.message ?? "Failed to delete");
      }
    });
  }

  return (
    <>
    <ConfirmModal
      open={showDeleteConfirm}
      title="Delete Lead"
      message={<>Delete lead <strong>{lead.name ?? `#${lead.id}`}</strong>? This cannot be undone.</>}
      confirmLabel="Yes, Delete"
      variant="danger"
      icon={<Trash2 className="h-5 w-5 text-red-600" />}
      isPending={isPending}
      onConfirm={handleDelete}
      onClose={() => setShowDeleteConfirm(false)}
    />
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ChevronLeft size={14} /> Back to Leads
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {lead.name ?? <span className="italic text-gray-400">Anonymous (phone only)</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 font-mono">
            Lead #{lead.id} • {sourceLabel(lead.source)} • Received{" "}
            {lead.createdAt ? formatDateTime(lead.createdAt) : "—"}
          </p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold px-3 py-2 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left — Contact + Order */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Info icon={<Mail size={14} />} label="Email">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">
                    {lead.email}
                  </a>
                ) : (
                  <span className="italic text-gray-400">Not provided</span>
                )}
              </Info>
              <Info icon={<Phone size={14} />} label="Phone">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-indigo-600 hover:underline">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="italic text-gray-400">Not provided</span>
                )}
              </Info>
            </div>
          </div>

          {/* Courses */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              Course{lead.courses.length !== 1 ? "s" : ""} ({lead.courses.length})
            </h2>
            {lead.courses.length === 0 ? (
              <p className="text-sm text-gray-400">No courses referenced.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {lead.courses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <BookOpen size={14} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-400 font-mono">#{c.id} • {c.slug || "—"}</p>
                      </div>
                    </div>
                    {c.slug && (
                      <a
                        href={`/admin/courses?slug=${c.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        View <ExternalLink size={11} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm">
              <Row label="Subtotal" value={`Tk ${Number(lead.subtotal).toLocaleString()}`} />
              <Row
                label={lead.couponCode ? `Discount (${lead.couponCode})` : "Discount"}
                value={`−Tk ${Number(lead.discountAmount).toLocaleString()}`}
                muted={Number(lead.discountAmount) === 0}
              />
              <Row
                label="Payment method"
                value={lead.paymentMethod ?? "Not selected"}
                muted={!lead.paymentMethod}
              />
              <div className="border-t border-gray-100 pt-2.5">
                <Row
                  label={<span className="font-bold text-gray-900">Final amount</span>}
                  value={
                    <span className="font-bold text-green-600">
                      Tk {Number(lead.finalAmount).toLocaleString()}
                    </span>
                  }
                />
              </div>
              {lead.orderId && (
                <div className="border-t border-gray-100 pt-2.5">
                  <Row
                    label="Linked order"
                    value={
                      <span className="font-mono text-xs text-gray-600">#{lead.orderId}</span>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Status + Notes */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-2">
              {STATUSES.map((s) => {
                const active = status === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatus(s.key)}
                    disabled={isPending}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors ${
                      active
                        ? "border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50/40"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        active ? "border-indigo-500" : "border-gray-300"
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                    </span>
                    <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provision: account + enroll, via the unified flow */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <GraduationCap size={15} /> Create Account &amp; Enroll
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {lead.orderPaid
                ? "This lead paid. Enrolling reuses their existing invoice and grants access."
                : "Create a login account for this lead, optionally enrolling them into a course."}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setEnroll({ mode: "enroll" })}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-brand-700 disabled:opacity-50"
              >
                <GraduationCap size={14} /> Enroll
              </button>
              <button
                onClick={() => setEnroll({ mode: "account" })}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 hover:bg-gray-50 disabled:opacity-50"
              >
                <UserPlus size={14} /> Create Account only
              </button>
            </div>
            {lead.convertedUserId && (
              <p className="text-[11px] text-emerald-600 mt-3">
                ✓ Linked to user #{lead.convertedUserId}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag size={14} /> Admin Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder="Call summary, next-step reminders, anything the team should know…"
              disabled={isPending}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none disabled:opacity-60"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!dirty || isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-3 rounded-xl"
          >
            {isPending ? "Saving…" : dirty ? "Save Changes" : "No changes"}
          </button>
        </div>
      </div>

      {enroll && (
        <ManualEnrollModal
          lead={leadCtx}
          mode={enroll.mode}
          onClose={() => setEnroll(null)}
          onEnrolled={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
    </>
  );
}

function sourceLabel(source: Lead["source"]) {
  switch (source) {
    case "checkout":        return "Checkout";
    case "live_checkout":   return "Live/Bundle checkout";
    case "interest_box":    return "Interest box";
    case "callback_widget": return "Callback widget";
    case "manual":          return "Manual";
    default:                return source;
  }
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
        {icon} {label}
      </p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-gray-400" : "text-gray-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
