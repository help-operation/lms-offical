"use client";

import { DataTable, type Column } from "@repo/ui/data-table";
import type { PaymentRecord } from "../api";
import { useLocalization } from "@/shared/context/LocalizationContext";

const currency = (n: number) => `৳${Math.round(n).toLocaleString()}`;
const avatarColors = ["bg-pink-400", "bg-violet-400", "bg-blue-400", "bg-amber-400", "bg-teal-400"];

// Recorded and live payments come from separate tables with independent id
// sequences, so a plain `id` can collide across the two — key rows by type+id
// (same fix as the dashboard's Per Course Student List).
type PaymentRow = Omit<PaymentRecord, "id"> & { id: string };

export function PaymentListClient({ title, records, status }: { title: string; records: PaymentRecord[]; status: "completed" | "failed" }) {
  const { formatDateTime } = useLocalization();
  const rows: PaymentRow[] = records.map((r) => ({ ...r, id: `${r.courseType}-${r.id}` }));
  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
          {records.length.toLocaleString()} payments · {currency(totalAmount)} total
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Payment Records</h2>
        </div>
        <div className="px-6 pt-5 pb-6">
      <DataTable
        data={rows}
        searchKeys={["userFirstName", "userLastName", "userEmail", "invoiceNumber"]}
        columns={[
          {
            key: "student",
            header: "Student",
            render: (r: PaymentRow, i: number) => (
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {r.userFirstName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{r.userFirstName} {r.userLastName}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{r.userEmail}</p>
                </div>
              </div>
            ),
          },
          {
            key: "courseTitles",
            header: "Course",
            render: (r: PaymentRow) => (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-700 dark:text-slate-300">{r.courseTitles ?? "—"}</span>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    r.courseType === "live" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" : "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400"
                  }`}
                >
                  {r.courseType === "live" ? "Live" : "Recorded"}
                </span>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (r: PaymentRow) => (
              <span className={`text-xs font-bold ${status === "completed" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {currency(Number(r.amount))}
              </span>
            ),
          },
          {
            key: "method",
            header: "Method",
            render: (r: PaymentRow) =>
              r.method ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                  {r.method}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
              ),
          },
          {
            key: "date",
            header: "Date",
            render: (r: PaymentRow) => <span className="text-[11px] text-gray-400 dark:text-slate-500">{r.date ? formatDateTime(r.date) : "—"}</span>,
          },
        ] as Column<PaymentRow>[]}
        emptyMessage={`No ${title.toLowerCase()} yet`}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
      />
        </div>
      </div>
    </div>
  );
}
