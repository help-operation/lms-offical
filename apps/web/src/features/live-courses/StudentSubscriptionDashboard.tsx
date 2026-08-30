"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Ban,
  Shield,
  Receipt,
  Calendar,
  Wallet,
  CreditCard as CardIcon,
} from "lucide-react";
import { liveSubscriptionApiBrowser } from "./api/browser";
import type { SubscriptionStatus, SubscriptionPayment } from "./api/curriculum";

interface Props {
  courseSlug: string;
  courseId: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  active: {
    label: "Active",
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Pending",
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  past_due: {
    label: "Past Due",
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Expired",
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    icon: <Ban className="h-3.5 w-3.5" />,
  },
  paused: {
    label: "Paused",
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

const PAYMENT_STATUS: Record<string, { badge: string }> = {
  completed: {
    badge: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  },
  pending: {
    badge: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30",
  },
  failed: {
    badge: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  },
  refunded: {
    badge: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
  },
};

const GATEWAY_LABELS: Record<string, string> = {
  bkash_pgw: "bKash",
  paystation: "PayStation",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentSubscriptionDashboard({ courseSlug, courseId }: Props) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const subRes = await liveSubscriptionApiBrowser.status(courseId);
      setSubscription(subRes.data.subscription);
      if (subRes.data.subscription) {
        const paymentsRes = await liveSubscriptionApiBrowser.payments(subRes.data.subscription.id);
        setPayments(paymentsRes.data);
      }
    } catch {
      setError("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  }, [courseId, subscription?.id]);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    if (!subscription) return;
    setCancelling(true);
    try {
      await liveSubscriptionApiBrowser.cancel(courseId, subscription.id);
      await loadData();
      setShowCancelConfirm(false);
    } catch {
      setError("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
          <Receipt className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No subscription found
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            You haven&apos;t subscribed to this course yet.
          </p>
        </div>
        <Link
          href={`/student/live/${courseSlug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[var(--color-brand)] rounded-xl hover:bg-[var(--color-brand-hover)] transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>
      </div>
    );
  }

  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] ?? {
    label: subscription.status,
    badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    icon: <Clock className="h-3.5 w-3.5" />,
  };

  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-red-200/60 dark:border-red-800/40 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-500/5 dark:to-pink-500/5 p-4 flex items-start gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Payment Error</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/student/live/${courseSlug}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm font-medium text-[var(--color-brand)]">Student Portal</p>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">Subscription</h1>
        </div>
      </div>

      {/* Warning banner */}
      {(subscription.status === "past_due" || subscription.status === "expired") && (
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 p-4 flex items-start gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {subscription.status === "expired"
                ? "Your subscription has expired"
                : "Payment overdue"}
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
              {subscription.status === "expired"
                ? "Renew now to regain access to your course."
                : "Please renew to continue accessing the course."}
            </p>
          </div>
        </div>
      )}

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand-from)] via-[var(--color-brand-to)] to-[var(--color-brand-from)] p-6 sm:p-8 text-white shadow-lg shadow-[var(--color-brand)]/20">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative">
          {/* Status + plan label */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/25">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white/80">Monthly Plan</span>
            </div>
            <span className={statusConfig.badge}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              ৳{Number(subscription.monthlyPrice).toLocaleString()}
            </p>
            <p className="text-sm font-medium text-white/60 mt-1">per month &middot; auto-recurring</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {subscription.nextBillingDate && subscription.status === "active" && (
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 ring-1 ring-white/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-white/50" />
                  <p className="text-[11px] text-white/50 uppercase tracking-wider">Next Billing</p>
                </div>
                <p className="text-sm font-bold">{formatDate(subscription.nextBillingDate)}</p>
              </div>
            )}
            {subscription.lastPaymentAt && (
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 ring-1 ring-white/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/50" />
                  <p className="text-[11px] text-white/50 uppercase tracking-wider">Last Payment</p>
                </div>
                <p className="text-sm font-bold">{formatDate(subscription.lastPaymentAt)}</p>
              </div>
            )}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 ring-1 ring-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <CardIcon className="h-3.5 w-3.5 text-white/50" />
                <p className="text-[11px] text-white/50 uppercase tracking-wider">Gateway</p>
              </div>
              <p className="text-sm font-bold">{GATEWAY_LABELS[subscription.gateway] ?? subscription.gateway}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 ring-1 ring-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Wallet className="h-3.5 w-3.5 text-white/50" />
                <p className="text-[11px] text-white/50 uppercase tracking-wider">Total Paid</p>
              </div>
              <p className="text-sm font-bold">৳{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {subscription.canCancel && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm"
          >
            <Ban className="h-4 w-4" />
            Cancel Subscription
          </button>
        )}
        <button
          onClick={async () => {
            if (!subscription) return;
            setRenewing(true);
            setError(null);
            try {
              const res = await liveSubscriptionApiBrowser.renew(courseId, subscription.id);
              if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
              }
            } catch (err: any) {
              const msg = err?.message || "Failed to initiate payment";
              setError(msg);
            } finally {
              setRenewing(false);
            }
          }}
          disabled={renewing}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[var(--color-brand)] rounded-xl hover:bg-[var(--color-brand-hover)] transition-all shadow-sm disabled:opacity-50"
        >
          {renewing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {renewing
            ? "Redirecting..."
            : subscription.canRenew
              ? (subscription.gateway === "bkash_pgw" ? "Re-authorize" : "Renew Now")
              : "Pay Early"}
        </button>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <Shield className="h-4 w-4 text-slate-400 shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Your payments are encrypted and processed securely. Cancel anytime — you&apos;ll keep access until the billing period ends.
        </p>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl border-0 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payment History</h2>
            </div>
            {payments.length > 0 && (
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {payments.length}
              </span>
            )}
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 mb-3">
              <CreditCard className="h-6 w-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">No payments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((p) => {
              const ps = PAYMENT_STATUS[p.status] ?? { badge: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30" };
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        ৳{Number(p.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {p.paidAt ? formatDate(p.paidAt) : p.createdAt ? formatDate(p.createdAt) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {GATEWAY_LABELS[p.method] ?? p.method}
                    </span>
                    <span className={ps.badge}>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/15">
                <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cancel Subscription?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You&apos;ll keep access until the current billing period ends.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin inline" />
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
