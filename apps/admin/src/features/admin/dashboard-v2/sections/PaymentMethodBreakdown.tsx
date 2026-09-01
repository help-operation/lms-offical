import type { DashboardOverview } from "../api";

const METHOD_LABELS: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  upay: "Upay",
  card: "Visa / Master Card",
  free: "Free",
  other: "Others",
};

const METHOD_COLORS: Record<string, string> = {
  bkash: "bg-pink-500",
  nagad: "bg-orange-500",
  rocket: "bg-purple-500",
  upay: "bg-cyan-500",
  card: "bg-blue-500",
  free: "bg-emerald-500",
  other: "bg-gray-400",
};

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

export function PaymentMethodBreakdown({ data }: { data: DashboardOverview["paymentMethods"] }) {
  const rows = Object.entries(data)
    .map(([method, total]) => ({ method, label: METHOD_LABELS[method] ?? method, total }))
    .sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden relative">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-50/60 to-transparent rounded-bl-full dark:from-amber-500/5" />
      <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800 relative z-10">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payment Method</h2>
      </div>
      <div className="px-6 pt-5 pb-6 relative z-10">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">No payments in this range</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 dark:text-slate-500">
                <th className="font-medium pb-3">Method</th>
                <th className="font-medium pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
                return (
                  <tr key={r.method} className="group border-t border-gray-50 dark:border-slate-800">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${METHOD_COLORS[r.method] ?? "bg-gray-400"} shadow-sm`} />
                        <span className="font-medium text-gray-700 dark:text-slate-300">{r.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{currency(r.total)}</span>
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-200 dark:border-slate-700">
                <td className="py-2.5 font-bold text-gray-900 dark:text-white">Total</td>
                <td className="py-2.5 text-right font-bold text-gray-900 dark:text-white">{currency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
