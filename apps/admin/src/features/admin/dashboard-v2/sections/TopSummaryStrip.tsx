import { UserPlus, Target, DollarSign, Wallet, Headset, CheckCircle2, XCircle } from "lucide-react";
import type { DashboardPeriod } from "@repo/ui/dashboard-filter-bar";
import type { DashboardOverview } from "../api";
import { StatCard, type StatCardDef } from "../shared/stat-card";
import { periodLabel, periodValue, periodWindowStat } from "../shared/period-value";

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

function generateSparkline(change: number | null | undefined, base: number): number[] {
  const points: number[] = [];
  const len = 7;
  const trend = (change ?? 0) >= 0 ? 1 : -1;
  const magnitude = Math.abs(change ?? 0);
  for (let i = 0; i < len; i++) {
    const progress = i / (len - 1);
    const baseVal = base || 10;
    const trendVal = baseVal + trend * magnitude * 0.5 * progress;
    const noise = Math.sin(i * 1.2) * baseVal * 0.15;
    points.push(Math.max(0, Math.round(trendVal + noise)));
  }
  return points;
}

export function TopSummaryStrip({ data, period }: { data: DashboardOverview; period: DashboardPeriod }) {
  const student = periodWindowStat(data.topStats, period);

  const cards: StatCardDef[] = [
    { label: periodLabel(period, "New Student"), value: student.count.toLocaleString(), icon: UserPlus, iconBg: "bg-brand-100", iconColor: "text-brand-600", cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900", href: "/admin/students", sparkData: generateSparkline(student.change, student.count), sparkColor: "#a64dff" },
    { label: periodLabel(period, "Lead"), value: periodValue(data.leadOverview, period).toLocaleString(), icon: Target, iconBg: "bg-pink-100", iconColor: "text-pink-600", cardBg: "bg-gradient-to-br from-pink-50/80 to-white dark:from-pink-500/10 dark:to-slate-900", href: "/admin/leads", sparkData: generateSparkline(data.leadOverview.year > 0 ? 12 : null, periodValue(data.leadOverview, period)), sparkColor: "#ec4899" },
    { label: periodLabel(period, "Revenue"), value: currency(periodValue(data.revenueOverview, period)), icon: DollarSign, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900", href: "/admin/revenue", sparkData: generateSparkline(12.3, periodValue(data.revenueOverview, period)), sparkColor: "#10b981" },
    { label: periodLabel(period, "Receivable"), value: currency(periodValue(data.receivableOverview, period)), icon: Wallet, iconBg: "bg-amber-100", iconColor: "text-amber-600", cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900", href: "/admin/invoices", sparkData: generateSparkline(-5, periodValue(data.receivableOverview, period)), sparkColor: "#f59e0b" },
    { label: periodLabel(period, "Support"), value: periodValue(data.supportOverview, period).toLocaleString(), icon: Headset, iconBg: "bg-blue-100", iconColor: "text-blue-600", cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900", href: "/admin/support", sparkData: generateSparkline(8, periodValue(data.supportOverview, period)), sparkColor: "#3b82f6" },
    { label: "Total Due Amount", value: currency(data.receivableOverview.due), icon: Wallet, iconBg: "bg-red-100", iconColor: "text-red-600", cardBg: "bg-gradient-to-br from-red-50/80 to-white dark:from-red-500/10 dark:to-slate-900", href: "/admin/invoices", sparkData: generateSparkline(-3, data.receivableOverview.due), sparkColor: "#ef4444" },
    { label: periodLabel(period, "Complete Payment"), value: periodValue(data.paymentStatus.completed, period).toLocaleString(), icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900", href: "/admin/payments", sparkData: generateSparkline(15, periodValue(data.paymentStatus.completed, period)), sparkColor: "#10b981" },
    { label: periodLabel(period, "Failed Payment"), value: periodValue(data.paymentStatus.failed, period).toLocaleString(), icon: XCircle, iconBg: "bg-red-100", iconColor: "text-red-600", cardBg: "bg-gradient-to-br from-red-50/80 to-white dark:from-red-500/10 dark:to-slate-900", href: "/admin/failed-payment", sparkData: generateSparkline(-8, periodValue(data.paymentStatus.failed, period)), sparkColor: "#ef4444" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} card={card} />
      ))}
    </div>
  );
}
