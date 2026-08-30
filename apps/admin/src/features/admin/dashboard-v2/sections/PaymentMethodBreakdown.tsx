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

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;

export function PaymentMethodBreakdown({ data }: { data: DashboardOverview["paymentMethods"] }) {
  const rows = Object.entries(data)
    .map(([method, total]) => ({ method, label: METHOD_LABELS[method] ?? method, total }))
    .sort((a, b) => b.total - a.total);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payment Method</h2>
      </div>
      <div className="px-6 pt-5 pb-6">
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">No payments in this range</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 dark:text-slate-500">
                <th className="font-medium pb-2">Method</th>
                <th className="font-medium pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.method} className="border-t border-gray-50 dark:border-slate-800">
                  <td className="py-2 font-medium text-gray-700 dark:text-slate-300">{r.label}</td>
                  <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{currency(r.total)}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 dark:border-slate-700">
                <td className="py-2 font-bold text-gray-900 dark:text-white">Total</td>
                <td className="py-2 text-right font-bold text-gray-900 dark:text-white">{currency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
