"use client";

import { useState, useTransition } from "react";
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";
import { getAnalyticsAction } from "@/features/admin/actions/support.actions";
import type { SupportAnalytics } from "@/features/admin/api/support";
import { DataTable, type Column } from "@repo/ui/data-table";

// ── Inline SVG charts ──────────────────────────────────────────────────────────

/** Sparkline area chart for daily ticket trend */
function TrendChart({ data, days }: { data: { date: string; created: number }[]; days: number }) {
  const W = 600; const H = 120; const PAD = 10;

  if (data.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-slate-500">
        Not enough data for the selected period
      </div>
    );
  }

  // Fill in missing days with 0
  const filled: { date: string; created: number }[] = [];
  const since = new Date(Date.now() - days * 86400000);
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find((r) => r.date === key);
    filled.push({ date: key, created: found?.created ?? 0 });
  }

  const maxVal = Math.max(...filled.map((r) => r.created), 1);
  const xStep  = (W - PAD * 2) / Math.max(filled.length - 1, 1);

  const points = filled.map((r, i) => ({
    x: PAD + i * xStep,
    y: H - PAD - ((r.created / maxVal) * (H - PAD * 2)),
    ...r,
  }));

  const first    = points[0]!;
  const last     = points[points.length - 1]!;
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area     = `M${first.x},${H - PAD} ` +
                   points.map((p) => `L${p.x},${p.y}`).join(" ") +
                   ` L${last.x},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area}   fill="url(#trendGrad)" />
      <polyline points={polyline} fill="none" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinejoin="round" />
      {/* Y axis gridlines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={PAD} y1={H - PAD - pct * (H - PAD * 2)}
          x2={W - PAD} y2={H - PAD - pct * (H - PAD * 2)}
          stroke="var(--chart-grid)" strokeWidth="1"
        />
      ))}
      {/* X-axis date labels (show ~5 evenly spaced) */}
      {filled.filter((_, i) => i % Math.max(1, Math.floor(filled.length / 5)) === 0).map((r) => {
        const idx = filled.indexOf(r);
        const x   = PAD + idx * xStep;
        return (
          <text key={r.date} x={x} y={H} fontSize="9" fill="var(--chart-tick)" textAnchor="middle">
            {r.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

/** Horizontal bar chart for category / priority breakdown */
function HBar({
  data,
  colorFn,
}: {
  data: { label: string; count: number }[];
  colorFn: (label: string) => string;
}) {
  if (!data.length) return <p className="py-4 text-center text-xs text-gray-400 dark:text-slate-500">No data</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-slate-300">
            <span className="capitalize">{d.label.replace("_", " ")}</span>
            <span className="font-semibold">{d.count}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: colorFn(d.label) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Color maps ─────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  billing:        "#a855f7",
  technical:      "#ef4444",
  course_content: "#3b82f6",
  certificate:    "#22c55e",
  refund:         "#f97316",
  other:          "#9ca3af",
};

const PRIORITY_COLOR: Record<string, string> = {
  low:    "#9ca3af",
  medium: "#3b82f6",
  high:   "#f97316",
  urgent: "#ef4444",
};

// ── Summary card ──────────────────────────────────────────────────────────────

function Card({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none">
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? "text-gray-900 dark:text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────

function downloadCsv(days: number) {
  // The API streams the CSV directly — open in a new tab via cookie-bearing fetch
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/support/admin/analytics/export?days=${days}`;
  window.open(url, "_blank");
}

// ── Main client ────────────────────────────────────────────────────────────────

export function AnalyticsClient({ initial }: { initial: SupportAnalytics }) {
  const [data,      setData]    = useState(initial);
  const [period,    setPeriod]  = useState(initial.period);
  const [isPending, startTransition] = useTransition();

  function changePeriod(days: number) {
    setPeriod(days);
    startTransition(async () => {
      const res = await getAnalyticsAction(days);
      if (res.success) setData(res.data);
    });
  }

  const { summary, trend, byCategory, byPriority, agentPerformance } = data;

  const slaColor =
    summary.slaCompliancePct >= 90 ? "text-green-600 dark:text-green-400"
    : summary.slaCompliancePct >= 70 ? "text-yellow-600 dark:text-yellow-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">
      {/* Period picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => changePeriod(d)}
              disabled={isPending}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                period === d
                  ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand shadow-sm ring-1 ring-gray-200 dark:ring-slate-700"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isPending && <CircleNotch className="h-4 w-4 animate-spin text-brand-500 dark:text-brand" />}
          <button
            onClick={() => downloadCsv(period)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <DownloadSimple className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card label="Total Tickets"   value={summary.total}       />
        <Card label="Open"            value={summary.open}        color="text-blue-600 dark:text-blue-400" />
        <Card label="In Progress"     value={summary.in_progress} color="text-yellow-600 dark:text-yellow-400" />
        <Card label="Resolved"        value={summary.resolved}    color="text-green-600 dark:text-green-400" />
        <Card
          label="Avg Resolution"
          value={summary.avgResolutionHours != null ? `${summary.avgResolutionHours}h` : "—"}
          sub={summary.resolvedTotal > 0 ? `across ${summary.resolvedTotal} tickets` : "no resolved tickets yet"}
        />
        <Card
          label="SLA Compliance"
          value={summary.resolvedTotal > 0 ? `${summary.slaCompliancePct}%` : "—"}
          sub={summary.resolvedTotal > 0 ? `${summary.resolvedTotal} resolved` : "no resolved tickets yet"}
          color={summary.resolvedTotal > 0 ? slaColor : undefined}
        />
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Ticket Volume — Last {period} Days</h2>
          <span className="text-xs text-gray-400 dark:text-slate-500">{summary.total} created</span>
        </div>
        <TrendChart data={trend} days={period} />
      </div>

      {/* Category + Priority side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">By Category</h2>
          <HBar
            data={byCategory.map((r) => ({ label: r.category, count: r.count }))}
            colorFn={(label) => CATEGORY_COLOR[label] ?? "#9ca3af"}
          />
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">By Priority</h2>
          <HBar
            data={byPriority.map((r) => ({ label: r.priority, count: r.count }))}
            colorFn={(label) => PRIORITY_COLOR[label] ?? "#9ca3af"}
          />
        </div>
      </div>

      {/* Agent performance table */}
      {agentPerformance.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
          <div className="border-b border-gray-100 dark:border-slate-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Agent Performance</h2>
          </div>
          <div className="px-5 pt-5 pb-5">
          <DataTable
            data={agentPerformance}
            searchKeys={["name"]}
            columns={[
              {
                key: "name",
                header: "Agent",
                render: (a) => <span className="font-medium text-gray-900 dark:text-white">{a.name}</span>,
              },
              {
                key: "openTickets",
                header: "Open",
                render: (a) => <span className="text-blue-600 dark:text-blue-400">{a.openTickets}</span>,
              },
              {
                key: "resolvedTickets",
                header: "Resolved",
                render: (a) => <span className="text-green-600 dark:text-green-400">{a.resolvedTickets}</span>,
              },
              {
                key: "avgResolutionHours",
                header: "Avg Resolution",
                render: (a) => <span className="text-gray-600 dark:text-slate-300">{a.avgResolutionHours != null ? `${a.avgResolutionHours}h` : "—"}</span>,
              },
              {
                key: "rate",
                header: "Resolution Rate",
                render: (a) => {
                  const total = a.openTickets + a.resolvedTickets;
                  const rate  = total > 0 ? Math.round((a.resolvedTickets / total) * 100) : 0;
                  return (
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                        <div className="h-1.5 rounded-full bg-brand-500 dark:bg-brand" style={{ width: `${rate}%` }} />
                      </div>
                      <span className={`text-xs font-semibold ${rate >= 70 ? "text-green-600 dark:text-green-400" : rate >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500 dark:text-red-400"}`}>
                        {rate}%
                      </span>
                    </div>
                  );
                },
              },
            ] as Column<typeof agentPerformance[number]>[]}
            emptyMessage="No agent data"
            pageSize={20}
            showPageSizeSelector={false}
          />
          </div>
        </div>
      )}

      {agentPerformance.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 py-10 text-center">
          <p className="text-sm text-gray-400 dark:text-slate-500">No assigned tickets in this period — assign tickets to agents to see performance data.</p>
        </div>
      )}
    </div>
  );
}
