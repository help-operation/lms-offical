"use client";

import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CheckCircle2, Clock } from "lucide-react";
import { DataTable, type Column } from "@repo/ui/data-table";
import { useLocalization } from "@/shared/context/LocalizationContext";

const avatarColors = ["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-amber-400"];

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

export function RevenueClient({ orders, stats }: { orders: Order[]; stats: Stats }) {
  const { formatDate } = useLocalization();
  const earningData = buildMonthlyRevenue(orders, 12);
  const thisMonth = earningData[earningData.length - 1];
  const prevMonth = earningData[earningData.length - 2];
  const revenueChange =
    thisMonth && prevMonth ? pctChange(thisMonth.earning, prevMonth.earning) : null;

  const avgOrderValue = stats.paidOrders > 0 ? stats.totalRevenue / stats.paidOrders : 0;
  const failedOrders = orders.filter((o) => o.status === "failed" || o.status === "cancelled").length;

  const statCards = [
    {
      label: "Total Revenue (Paid)",
      value: currency(stats.totalRevenue),
      change: revenueChange,
      icon: DollarSign,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      change: null as number | null,
      icon: ShoppingCart,
    },
    {
      label: "Paid Orders",
      value: stats.paidOrders.toLocaleString(),
      change: null as number | null,
      icon: CheckCircle2,
    },
    {
      label: "Avg. Order Value",
      value: currency(avgOrderValue),
      change: null as number | null,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">{orders.length} orders total</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const positive = (card.change ?? 0) >= 0;
          return (
            <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">{card.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand/15 mb-3">
                <card.icon className="h-4 w-4 text-brand-600 dark:text-brand" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              {card.change !== null ? (
                <div className="flex items-center gap-1 mt-1">
                  {positive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={`text-xs font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
                    {positive ? "+" : ""}{card.change}% vs last month
                  </span>
                </div>
              ) : (
                <div className="h-[18px] mt-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Earning area chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Monthly Revenue</h2>
            <span className="text-xs text-gray-400 dark:text-slate-500">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={earningData}>
              <defs>
                <linearGradient id="earningGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--chart-tick)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  fontSize: 12,
                  background: "var(--chart-tooltip-bg)",
                  color: "var(--chart-tooltip-text)",
                }}
                formatter={(v) => [currency(Number(v)), "Earning"]}
              />
              <Area type="monotone" dataKey="earning" stroke="var(--color-brand-500)" strokeWidth={2.5} fill="url(#earningGrad)" dot={{ r: 3, fill: "var(--color-brand-500)" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Order Breakdown</h2>
          <div className="space-y-3">
            <BreakdownRow
              icon={<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
              label="Paid"
              count={stats.paidOrders}
              total={stats.totalOrders}
              color="bg-green-500"
            />
            <BreakdownRow
              icon={<Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
              label="Pending"
              count={stats.pendingOrders}
              total={stats.totalOrders}
              color="bg-yellow-400"
            />
            <BreakdownRow
              icon={<TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />}
              label="Failed / Cancelled"
              count={failedOrders}
              total={stats.totalOrders}
              color="bg-red-400"
            />
          </div>
          <div className="mt-5 rounded-xl bg-brand-50 dark:bg-brand/10 p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400">Average order value (paid)</p>
            <p className="text-xl font-bold text-brand-700 dark:text-brand">{currency(avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recent Orders</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
        <DataTable
          data={orders}
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

function BreakdownRow({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</p>
          <p className="text-xs font-semibold text-gray-900 dark:text-white">{count} ({pct}%)</p>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
    failed: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    cancelled: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    refunded: "bg-gray-100 text-gray-600 dark:bg-slate-500/15 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
