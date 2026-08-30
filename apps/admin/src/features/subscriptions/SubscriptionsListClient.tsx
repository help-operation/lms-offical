"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Ban,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  fetchSubscriptionsAction,
  fetchSubscriptionDetailsAction,
  cancelSubscriptionAdminAction,
  pauseSubscriptionAdminAction,
  resumeSubscriptionAdminAction,
  type SubscriptionsListResponse,
  type SubscriptionDetails,
} from "./actions";
import { toast } from "@repo/ui/sonner";

const STATUS_FILTERS = ["", "active", "past_due", "cancelled", "expired", "paused"];

const STATUS_BADGES: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  past_due: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  expired: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  paused: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
};

interface Props {
  initialData: SubscriptionsListResponse | null;
  initialStatus?: string;
}

export function SubscriptionsListClient({ initialData, initialStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState(initialStatus ?? "");
  const [detailsTarget, setDetailsTarget] = useState<SubscriptionDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function handleFilterChange(status: string) {
    setStatusFilter(status);
    startTransition(async () => {
      const res = await fetchSubscriptionsAction(status || undefined, 1);
      if (res.data) setData(res.data);
    });
  }

  async function handlePageChange(page: number) {
    startTransition(async () => {
      const res = await fetchSubscriptionsAction(statusFilter || undefined, page);
      if (res.data) setData(res.data);
    });
  }

  async function loadDetails(id: number) {
    setLoadingDetails(true);
    try {
      const res = await fetchSubscriptionDetailsAction(id);
      if (res.data) setDetailsTarget(res.data);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleCancel(sub: SubscriptionDetails) {
    setActionLoading(sub.id);
    try {
      const res = await cancelSubscriptionAdminAction(sub.id);
      if (res.data) {
        toast.success("Subscription cancelled");
        setDetailsTarget(null);
        // Refresh list
        const listRes = await fetchSubscriptionsAction(statusFilter || undefined, data?.meta.page ?? 1);
        if (listRes.data) setData(listRes.data);
      } else {
        toast.error(res.error ?? "Failed to cancel subscription");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePause(sub: SubscriptionDetails) {
    setActionLoading(sub.id);
    try {
      const res = await pauseSubscriptionAdminAction(sub.id);
      if (res.data) {
        toast.success("Subscription paused");
        setDetailsTarget(null);
        const listRes = await fetchSubscriptionsAction(statusFilter || undefined, data?.meta.page ?? 1);
        if (listRes.data) setData(listRes.data);
      } else {
        toast.error(res.error ?? "Failed to pause subscription");
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume(sub: SubscriptionDetails) {
    setActionLoading(sub.id);
    try {
      const res = await resumeSubscriptionAdminAction(sub.id);
      if (res.data) {
        toast.success("Subscription resumed");
        setDetailsTarget(null);
        const listRes = await fetchSubscriptionsAction(statusFilter || undefined, data?.meta.page ?? 1);
        if (listRes.data) setData(listRes.data);
      } else {
        toast.error(res.error ?? "Failed to resume subscription");
      }
    } finally {
      setActionLoading(null);
    }
  }

  const subscriptions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Subscriptions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage student subscriptions and billing
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === s
                ? "bg-brand-solid text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-brand-solid" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
            No subscriptions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Student</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Course</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Next Billing</th>
                  <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{sub.userName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{sub.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/live-courses/${sub.courseSlug}`}
                        className="text-sm font-medium text-brand-solid hover:text-brand-hover"
                      >
                        {sub.courseTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_BADGES[sub.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      ৳{Number(sub.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {sub.nextBillingAt
                        ? new Date(sub.nextBillingAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => loadDetails(sub.id)}
                        disabled={loadingDetails}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {detailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Subscription Details</h2>
              <button
                onClick={() => setDetailsTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-500">Student</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{detailsTarget.userName}</p>
                <p className="text-xs text-slate-500">{detailsTarget.userEmail}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Course</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{detailsTarget.courseTitle}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Status</p>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_BADGES[detailsTarget.status] ?? ""}`}>
                  {detailsTarget.status}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Gateway</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {detailsTarget.gateway === "bkash_pgw" ? "bKash" : detailsTarget.gateway}
                </p>
              </div>
              {detailsTarget.gatewaySubscriptionId && (
                <div className="col-span-2">
                  <p className="text-[11px] text-slate-500">Agreement ID</p>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300">{detailsTarget.gatewaySubscriptionId}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-slate-500">Monthly Price</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">৳{Number(detailsTarget.amount).toLocaleString()}</p>
              </div>
              {detailsTarget.nextBillingAt && (
                <div>
                  <p className="text-[11px] text-slate-500">Next Billing</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {new Date(detailsTarget.nextBillingAt).toLocaleDateString("en-BD")}
                  </p>
                </div>
              )}
            </div>

            {/* Payment history */}
            {detailsTarget.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment History</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-1.5 text-[10px] font-medium text-slate-500">Date</th>
                        <th className="pb-1.5 text-[10px] font-medium text-slate-500">Amount</th>
                        <th className="pb-1.5 text-[10px] font-medium text-slate-500">Status</th>
                        <th className="pb-1.5 text-[10px] font-medium text-slate-500">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {detailsTarget.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1.5 text-[11px] text-slate-600">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-BD") : "—"}
                          </td>
                          <td className="py-1.5 text-[11px] font-semibold">৳{Number(p.amount).toLocaleString()}</td>
                          <td className="py-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                              p.status === "completed" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-1.5 text-[11px] text-slate-600 capitalize">{p.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {detailsTarget.status === "active" && (
                <>
                  <button
                    onClick={() => handlePause(detailsTarget)}
                    disabled={actionLoading === detailsTarget.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === detailsTarget.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                    Pause
                  </button>
                  <button
                    onClick={() => handleCancel(detailsTarget)}
                    disabled={actionLoading === detailsTarget.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === detailsTarget.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                    Cancel
                  </button>
                </>
              )}
              {detailsTarget.status === "paused" && (
                <button
                  onClick={() => handleResume(detailsTarget)}
                  disabled={actionLoading === detailsTarget.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  {actionLoading === detailsTarget.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Resume
                </button>
              )}
              {(detailsTarget.status === "cancelled" || detailsTarget.status === "expired") && (
                <button
                  onClick={() => handleCancel(detailsTarget)}
                  disabled={actionLoading === detailsTarget.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {actionLoading === detailsTarget.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
