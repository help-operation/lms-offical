import { UserPlus, Target, DollarSign, Wallet, Headset, CheckCircle2, XCircle } from "lucide-react";
import type { DashboardPeriod } from "@repo/ui/dashboard-filter-bar";
import type { DashboardOverview } from "../api";
import { StatCard, type StatCardDef } from "../shared/stat-card";
import { periodLabel, periodValue, periodWindowStat } from "../shared/period-value";

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

export function TopSummaryStrip({ data, period }: { data: DashboardOverview; period: DashboardPeriod }) {
  const student = periodWindowStat(data.topStats, period);

  const cards: StatCardDef[] = [
    { label: periodLabel(period, "New Student"), value: student.count.toLocaleString(), icon: UserPlus, iconBg: "bg-brand-100", iconColor: "text-brand-600", href: "/admin/students" },
    { label: periodLabel(period, "Lead"), value: periodValue(data.leadOverview, period).toLocaleString(), icon: Target, iconBg: "bg-pink-100", iconColor: "text-pink-600", href: "/admin/leads" },
    { label: periodLabel(period, "Revenue"), value: currency(periodValue(data.revenueOverview, period)), icon: DollarSign, iconBg: "bg-green-100", iconColor: "text-green-600", href: "/admin/revenue" },
    { label: periodLabel(period, "Receivable"), value: currency(periodValue(data.receivableOverview, period)), icon: Wallet, iconBg: "bg-amber-100", iconColor: "text-amber-600", href: "/admin/invoices" },
    { label: periodLabel(period, "Support"), value: periodValue(data.supportOverview, period).toLocaleString(), icon: Headset, iconBg: "bg-blue-100", iconColor: "text-blue-600", href: "/admin/support" },
    { label: "Total Due Amount", value: currency(data.receivableOverview.due), icon: Wallet, iconBg: "bg-red-100", iconColor: "text-red-600", href: "/admin/invoices" },
    { label: periodLabel(period, "Complete Payment"), value: periodValue(data.paymentStatus.completed, period).toLocaleString(), icon: CheckCircle2, iconBg: "bg-green-100", iconColor: "text-green-600", href: "/admin/complete-payment" },
    { label: periodLabel(period, "Failed Payment"), value: periodValue(data.paymentStatus.failed, period).toLocaleString(), icon: XCircle, iconBg: "bg-red-100", iconColor: "text-red-600", href: "/admin/failed-payment" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} card={card} />
      ))}
    </div>
  );
}
