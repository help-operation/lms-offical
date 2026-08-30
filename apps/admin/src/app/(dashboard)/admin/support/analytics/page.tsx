import { getAnalyticsAction } from "@/features/admin/actions/support.actions";
import { AnalyticsClient } from "@/features/admin/AnalyticsClient";
import type { SupportAnalytics } from "@/features/admin/api/support";
import Link from "next/link";

export const metadata = { title: "Support Analytics" };

export default async function SupportAnalyticsPage() {
  const res = await getAnalyticsAction(30);

  const initial: SupportAnalytics = res.success
    ? res.data
    : {
        period: 30,
        summary: {
          total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0,
          avgResolutionHours: null, slaCompliancePct: 100, resolvedTotal: 0,
        },
        trend: [], byCategory: [], byPriority: [], agentPerformance: [],
      };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/support" className="text-sm text-gray-400 hover:text-gray-600">
          ← Support
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
      </div>
      <AnalyticsClient initial={initial} />
    </div>
  );
}
