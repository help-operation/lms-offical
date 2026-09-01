"use client";

import { useState } from "react";
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CheckCircle2, Clock, Download } from "lucide-react";
import { DataTable, type Column } from "@repo/ui/data-table";
import { useLocalization } from "@/shared/context/LocalizationContext";
import { Sparkline } from "@/features/admin/dashboard-v2/shared/sparkline";

const avatarColors = ["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-amber-400", "bg-emerald-400", "bg-cyan-400"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Order {
  id: number;
  userFirstName: string;
  userLastName: string;
  userEmail?: string | null;
  finalAmount: string | number;
  status: string;
  createdAt?: string | null;
}

interface Stats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

function buildMonthlyRevenue(orders: Order[], count: number) {
  const now = new Date();
  const buckets = Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()]!, earning: 0 };
  });
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const o of orders) {
    if (o.status !== "paid" || !o.createdAt) continue;
    const d = new Date(o.createdAt);
    const bucket = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.earning += Number(o.finalAmount) || 0;
  }
  return buckets;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function generateSparkline(orders: Order[], months: number): number[] {
  const data = buildMonthlyRevenue(orders, months);
  return data.map((d) => d.earning);
}

export function RevenueClient({ orders, stats }: { orders: Order[]; stats: Stats }) {
  const { formatDate } = useLocalization();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [chartView, setChartView] = useState<"week" | "month" | "year">("month");

  const earningData = buildMonthlyRevenue(orders, 12);
  const thisMonth = earningData[earningData.length - 1];
  const prevMonth = earningData[earningData.length - 2];
  const revenueChange = thisMonth && prevMonth ? pctChange(thisMonth.earning, prevMonth.earning) : null;

  const avgOrderValue = stats.paidOrders > 0 ? stats.totalRevenue / stats.paidOrders : 0;
  const failedOrders = orders.filter((o) => o.status === "failed" || o.status === "cancelled").length;
  const refundedOrders = orders.filter((o) => o.status === "refunded").length;
  const sparkData = generateSparkline(orders, 7);

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const statCards = [
    {
      label: "Total Revenue (Paid)",
      value: currency(stats.totalRevenue),
      change: revenueChange,
      icon: DollarSign,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900",
      sparkColor: "#10b981",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      change: null as number | null,
      icon: ShoppingCart,
      iconBg: "bg-brand-100",
      iconColor: "text-brand-600",
      cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900",
      sparkColor: "#a64dff",
    },
    {
      label: "Paid Orders",
      value: stats.paidOrders.toLocaleString(),
      change: null as number | null,
      icon: CheckCircle2,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900",
      sparkColor: "#3b82f6",
    },
    {
      label: "Avg. Order Value",
      value: currency(avgOrderValue),
      change: null as number | null,
      icon: TrendingUp,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900",
      sparkColor: "#f59e0b",
    },
  ];

  const donutData = [
    { label: "Paid", value: stats.paidOrders, color: "#10b981" },
    { label: "Pending", value: stats.pendingOrders, color: "#f59e0b" },
    { label: "Failed/Cancelled", value: failedOrders, color: "#ef4444" },
    { label: "Refunded", value: refundedOrders, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  // Dual line chart data (Revenue vs Pending)
  function buildDualChartData(view: "week" | "month" | "year") {
    const now = new Date();
    let len = 12;
    let labelFn: (d: Date) => string = (d) => MONTHS[d.getMonth()] ?? "";
    if (view === "week") { len = 7; labelFn = (d) => d.toLocaleDateString("en-US", { weekday: "short" }); }
    if (view === "year") { len = 5; labelFn = (d) => String(d.getFullYear()); }

    const buckets = Array.from({ length: len }, (_, i) => {
      const d = new Date(now);
      if (view === "week") d.setDate(d.getDate() - (len - 1 - i));
      else if (view === "month") d.setMonth(d.getMonth() - (len - 1 - i));
      else d.setFullYear(d.getFullYear() - (len - 1 - i));
      return { name: labelFn(d), revenue: 0, pending: 0 };
    });

    for (const o of orders) {
      if (!o.createdAt) continue;
      const d = new Date(o.createdAt);
      let matchIdx = -1;
      if (view === "week") {
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        matchIdx = len - 1 - diffDays;
      } else if (view === "month") {
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        matchIdx = len - 1 - diffMonths;
      } else {
        const diffYears = now.getFullYear() - d.getFullYear();
        matchIdx = len - 1 - diffYears;
      }
      if (matchIdx >= 0 && matchIdx < len) {
        const amt = Number(o.finalAmount) || 0;
        const bucket = buckets[matchIdx];
        if (bucket) {
          if (o.status === "paid") bucket.revenue += amt;
          else if (o.status === "pending") bucket.pending += amt;
        }
      }
    }
    return buckets;
  }

  const dualChartData = buildDualChartData(chartView);

  const statusFilters = [
    { key: "all", label: "All", count: orders.length },
    { key: "paid", label: "Paid", count: stats.paidOrders },
    { key: "pending", label: "Pending", count: stats.pendingOrders },
    { key: "failed", label: "Failed", count: orders.filter((o) => o.status === "failed").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
    { key: "refunded", label: "Refunded", count: refundedOrders },
  ];

  function exportCSV() {
    const headers = ["Order #", "Customer", "Email", "Amount", "Status", "Date"];
    const rows = filteredOrders.map((o) => [
      `#${o.id}`,
      `${o.userFirstName} ${o.userLastName}`,
      o.userEmail ?? "",
      String(Number(o.finalAmount)),
      o.status,
      o.createdAt ? formatDate(o.createdAt) : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{orders.length} orders total</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-600 dark:text-brand bg-brand-50 dark:bg-brand/10 rounded-xl hover:bg-brand-100 dark:hover:bg-brand/20 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const hasChange = card.change !== null && card.change !== undefined;
          const positive = (card.change ?? 0) >= 0;
          return (
            <div key={card.label} className={`group relative rounded-xl border border-white/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 p-3.5 overflow-hidden ${card.cardBg}`}>
              <div className="flex items-center gap-2.5 mb-2 min-w-0">
                <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${card.iconBg} dark:bg-white/10`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor} dark:text-slate-300`} />
                </div>
                <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">{card.label}</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{card.value}</p>
                  {hasChange && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {positive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-[10px] font-semibold ${positive ? "text-emerald-500" : "text-red-500"}`}>
                        {positive ? "+" : ""}{card.change}%
                      </span>
                    </div>
                  )}
                </div>
                <Sparkline data={sparkData} color={card.sparkColor} height={24} width={48} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Dual line chart - Revenue vs Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/60 to-transparent rounded-bl-full dark:from-emerald-500/5" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Performance</h2>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 rounded-lg p-0.5">
              {(["week", "month", "year"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-all ${
                    chartView === v
                      ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                  }`}
                >
                  {v === "week" ? "This Week" : v === "month" ? "This Month" : "This Year"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-gray-500 dark:text-slate-400">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-gray-500 dark:text-slate-400">Pending</span>
            </div>
          </div>
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dualChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    fontSize: 12,
                    background: "var(--chart-tooltip-bg)",
                    color: "var(--chart-tooltip-text)",
                    padding: "8px 12px",
                  }}
                  formatter={(v) => [currency(Number(v))]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={false} name="revenue" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" name="pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status breakdown - Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Order Breakdown</h2>
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="label" innerRadius={40} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                    {donutData.map((s) => (
                      <Cell key={s.label} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      fontSize: 12,
                      background: "var(--chart-tooltip-bg)",
                      color: "var(--chart-tooltip-text)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalOrders}</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {donutData.map((d) => {
                const pct = stats.totalOrders > 0 ? Math.round((d.value / stats.totalOrders) * 100) : 0;
                return (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-gray-600 dark:text-slate-400 flex-1">{d.label}</span>
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-white">{d.value}</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">Avg Order Value</span>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand">{currency(avgOrderValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund + Top Customers row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Refund Tracking */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-red-50/60 to-transparent rounded-bl-full dark:from-red-500/5" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Refund Tracking</h2>
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5 p-3 border border-red-100/50 dark:border-red-500/10">
              <p className="text-[11px] text-red-600/70 dark:text-slate-400 font-medium">Refunded Orders</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{refundedOrders}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 p-3 border border-amber-100/50 dark:border-amber-500/10">
              <p className="text-[11px] text-amber-600/70 dark:text-slate-400 font-medium">Refund Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalOrders > 0 ? Math.round((refundedOrders / stats.totalOrders) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-500/10 dark:to-brand-500/5 p-3 border border-brand-100/50 dark:border-brand-500/10">
              <p className="text-[11px] text-brand-600/70 dark:text-slate-400 font-medium">Refund Amount</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {currency(orders.filter((o) => o.status === "refunded").reduce((s, o) => s + Number(o.finalAmount), 0))}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 p-3 border border-emerald-100/50 dark:border-emerald-500/10">
              <p className="text-[11px] text-emerald-600/70 dark:text-slate-400 font-medium">Net Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {currency(stats.totalRevenue - orders.filter((o) => o.status === "refunded").reduce((s, o) => s + Number(o.finalAmount), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 relative z-10">Top Customers</h2>
          <div className="space-y-2.5 relative z-10">
            {(() => {
              const customerMap = new Map<string, { name: string; email: string; total: number; count: number; color: string }>();
              const colors = ["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-amber-400", "bg-emerald-400"];
              for (const o of orders) {
                if (o.status !== "paid") continue;
                const key = `${o.userFirstName}-${o.userLastName}`;
                const existing = customerMap.get(key);
                if (existing) {
                  existing.total += Number(o.finalAmount) || 0;
                  existing.count += 1;
                } else {
                  customerMap.set(key, {
                    name: `${o.userFirstName} ${o.userLastName}`,
                    email: o.userEmail ?? "",
                    total: Number(o.finalAmount) || 0,
                    count: 1,
                    color: colors[customerMap.size % colors.length] ?? "bg-gray-400",
                  });
                }
              }
              return Array.from(customerMap.values())
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${c.color}`}>
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">{c.count} orders</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{currency(c.total)}</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          </div>
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === f.key
                    ? "bg-brand-100 text-brand-700 dark:bg-brand/15 dark:text-brand"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 pt-4 pb-6">
          <DataTable
            data={filteredOrders}
            searchKeys={["userFirstName", "userLastName", "userEmail"]}
            searchPlaceholder="Search by customer name or email..."
            columns={[
              {
                key: "id",
                header: "Order #",
                render: (order: Order) => <span className="text-xs font-mono text-gray-400 dark:text-slate-500">#{order.id}</span>,
              },
              {
                key: "customer",
                header: "Customer",
                render: (order: Order, i: number) => (
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                      {order.userFirstName?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{order.userFirstName} {order.userLastName}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{order.userEmail}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "finalAmount",
                header: "Amount",
                render: (order: Order) => <span className="text-xs font-bold text-gray-900 dark:text-white">{currency(Number(order.finalAmount))}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (order: Order) => <OrderStatusBadge status={order.status} />,
              },
              {
                key: "createdAt",
                header: "Date",
                render: (order: Order) => <span className="text-[11px] text-gray-400 dark:text-slate-500">{order.createdAt ? formatDate(order.createdAt) : "—"}</span>,
              },
            ] as Column<Order>[]}
            emptyMessage="No orders yet"
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    failed: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    cancelled: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    refunded: "bg-gray-50 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-50 text-gray-600"}`}>
      {status}
    </span>
  );
}
