import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface StatCardDef {
  label: string;
  value: string;
  change?: number | null;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  /** When set, renders a "View All" link at the top-right of the card pointing here. */
  href?: string;
}

export function StatCard({ card }: { card: StatCardDef }) {
  const hasChange = card.change !== null && card.change !== undefined;
  const positive = (card.change ?? 0) >= 0;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-3">
      {card.href && (
        <div className="flex justify-end mb-1">
          <Link href={card.href} className="shrink-0 text-[10px] font-semibold text-brand-600 dark:text-brand hover:text-brand-700 hover:underline">
            View All
          </Link>
        </div>
      )}
      <div className="flex items-center gap-2 mb-1.5 min-w-0">
        <div className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${card.iconBg} dark:bg-white/10`}>
          <card.icon className={`h-3 w-3 ${card.iconColor} dark:text-slate-300`} />
        </div>
        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 truncate">{card.label}</p>
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white">{card.value}</p>
      {hasChange && (
        <div className="flex items-center gap-1 mt-0.5">
          {positive ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={`text-[10px] font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
            {positive ? "+" : ""}
            {card.change}%
          </span>
        </div>
      )}
    </div>
  );
}

export function StatCardGrid({ title, accentColor, cards }: { title: string; accentColor: string; cards: StatCardDef[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${accentColor} dark:text-brand uppercase tracking-wide`}>{title}</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>
    </div>
  );
}
