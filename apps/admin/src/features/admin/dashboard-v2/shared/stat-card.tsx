import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkline } from "./sparkline";

export interface StatCardDef {
  label: string;
  value: string;
  change?: number | null;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  /** Card background color (light tint) */
  cardBg?: string;
  /** When set, renders a "View All" link at the top-right of the card pointing here. */
  href?: string;
  /** Optional sparkline data for mini chart */
  sparkData?: number[];
  /** Sparkline color */
  sparkColor?: string;
}

export function StatCard({ card }: { card: StatCardDef }) {
  const hasChange = card.change !== null && card.change !== undefined;
  const positive = (card.change ?? 0) >= 0;
  return (
    <div
      className={`group relative rounded-xl border border-white/60 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-slate-800/50 transition-all duration-200 p-2.5 overflow-hidden ${card.cardBg ?? "bg-white dark:bg-slate-900"}`}
    >
      {card.href && (
        <div className="flex justify-end mb-1 relative z-10">
          <Link href={card.href} className="shrink-0 text-[10px] font-semibold text-brand-600 dark:text-brand hover:text-brand-700 hover:underline">
            View All
          </Link>
        </div>
      )}
      <div className="flex items-center gap-2 mb-1 min-w-0 relative z-10">
        <div className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${card.iconBg} dark:bg-white/10`}>
          <card.icon className={`h-3.5 w-3.5 ${card.iconColor} dark:text-slate-300`} />
        </div>
        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">{card.label}</p>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{card.value}</p>
          {hasChange && (
            <div className="flex items-center gap-1 mt-0.5">
              {positive ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-[10px] font-semibold ${positive ? "text-emerald-500" : "text-red-500"}`}>
                {positive ? "+" : ""}
                {card.change}%
              </span>
            </div>
          )}
        </div>
        {card.sparkData && card.sparkData.length > 1 && (
          <Sparkline
            data={card.sparkData}
            color={card.sparkColor ?? (positive ? "#10b981" : "#ef4444")}
            height={24}
            width={48}
          />
        )}
      </div>
    </div>
  );
}

export function StatCardGrid({ title, accentColor, cards, columns }: { title: string; accentColor: string; cards: StatCardDef[]; columns?: number }) {
  const colClass = columns === 4 ? "grid-cols-2 sm:grid-cols-4" : columns === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`h-5 w-1 rounded-full ${accentColor.includes("brand") ? "bg-brand-500" : accentColor.includes("blue") ? "bg-blue-500" : accentColor.includes("green") ? "bg-emerald-500" : accentColor.includes("pink") ? "bg-pink-500" : "bg-brand-500"}`} />
        <span className={`text-xs font-bold ${accentColor} dark:text-brand uppercase tracking-wider`}>{title}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-slate-700" />
      </div>
      <div className={`grid ${colClass} gap-3`}>
        {cards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>
    </div>
  );
}
