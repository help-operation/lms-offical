"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, XCircle, Calendar, Clock, Wallet } from "lucide-react";
import { dashboardApi, type CommunicationOverview } from "../api";

export function SmsOverviewCard() {
  const [data, setData] = useState<CommunicationOverview["sms"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .communication()
      .then((res) => setData(res.data.sms))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center justify-center h-[120px]">
          <div className="h-5 w-5 border-2 border-brand-300 dark:border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: "Balance",
      value: `৳${data.balance.toFixed(2)}`,
      sub: `~${data.estimatedSms.toLocaleString()} SMS`,
      icon: Wallet,
      iconBg: "bg-gradient-to-br from-brand-500 to-brand-600",
      cardBg: "bg-gradient-to-br from-brand-50/80 to-white dark:from-brand-500/10 dark:to-slate-900",
    },
    {
      label: "Today",
      value: data.today.toLocaleString(),
      icon: Clock,
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      cardBg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-500/10 dark:to-slate-900",
    },
    {
      label: "This Week",
      value: data.week.toLocaleString(),
      icon: Calendar,
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      cardBg: "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-900",
    },
    {
      label: "This Month",
      value: data.month.toLocaleString(),
      icon: Calendar,
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
      cardBg: "bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-900",
    },
    {
      label: "This Year",
      value: data.year.toLocaleString(),
      icon: Calendar,
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      cardBg: "bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-500/10 dark:to-slate-900",
    },
    {
      label: "Total Sent",
      value: data.totalSent.toLocaleString(),
      icon: Send,
      iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      cardBg: "bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-500/10 dark:to-slate-900",
    },
    {
      label: "Failed",
      value: data.totalFailed.toLocaleString(),
      icon: XCircle,
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
      cardBg: "bg-gradient-to-br from-red-50/80 to-white dark:from-red-500/10 dark:to-slate-900",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-brand-50/60 to-transparent rounded-bl-full dark:from-brand-500/5" />
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="h-5 w-1 rounded-full bg-brand-500" />
        <span className="text-xs font-bold text-brand-600 dark:text-brand uppercase tracking-wider">SMS Overview</span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-slate-700" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl ${card.cardBg} p-3 border border-white/60 dark:border-slate-800`}
          >
            <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${card.iconBg} mb-2`}>
              <card.icon className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{card.label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{card.value}</p>
            {"sub" in card && card.sub && (
              <p className="text-[10px] text-gray-400 dark:text-slate-500">{card.sub}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
