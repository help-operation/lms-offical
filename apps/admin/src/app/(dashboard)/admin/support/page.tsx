import {
  getTicketsAction,
  getAgentsAction,
  getStatsAction,
  listCannedResponsesAction,
} from "@/features/admin/actions/support.actions";
import { authApi } from "@/features/auth/api";
import { AdminTicketsClient } from "@/features/admin/AdminTicketsClient";
import type {
  AdminTicketsResponse,
  AdminAgent,
  SupportStats,
  CannedResponse,
} from "@/features/admin/api/support";

export const metadata = { title: "Support" };

export default async function AdminSupportPage() {
  const [ticketsRes, agentsRes, statsRes, cannedRes, meRes] = await Promise.all([
    getTicketsAction({ page: 1, per_page: 20 }),
    getAgentsAction(),
    getStatsAction(),
    listCannedResponsesAction(),
    authApi.me().catch(() => null),
  ]);

  const initial: AdminTicketsResponse = ticketsRes.success
    ? ticketsRes.data
    : { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  const agents: AdminAgent[]     = agentsRes.success ? agentsRes.data : [];
  const canned: CannedResponse[] = cannedRes.success ? cannedRes.data : [];
  const stats: SupportStats      = statsRes.success
    ? statsRes.data
    : { open: 0, in_progress: 0, resolved: 0, closed: 0, sla_breached: 0, unassigned: 0, total: 0, by_agent: [] };

  const myAdminId: number = meRes?.data?.id ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="mt-1 text-gray-500 dark:text-slate-400">{stats.total} total tickets</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/support/analytics"
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Analytics
          </a>
          <a
            href="/admin/support/canned-responses"
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Templates
          </a>
        </div>
      </div>
      <AdminTicketsClient
        initial={initial}
        agents={agents}
        stats={stats}
        canned={canned}
        myAdminId={myAdminId}
      />
    </div>
  );
}
