import { Receipt, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { myPaymentsApi } from "@/features/payments/api";
import { enrollmentsApi } from "@/features/courses/api/enrollments";
import { PaymentHistoryClient } from "@/features/payments/PaymentHistoryClient";

export const metadata = { title: "Payment History" };

function fmt(v: number) {
  return "\u09F3" + v.toLocaleString("en-BD");
}

export default async function PaymentHistoryPage() {
  const [paymentsRes, enrollmentsRes] = await Promise.all([
    myPaymentsApi.list().catch(() => null),
    enrollmentsApi.myEnrollments().catch(() => null),
  ]);

  const payments = paymentsRes?.data ?? [];
  const enrollments = enrollmentsRes?.data ?? [];

  // Calculate payment summary from enrollments
  const totalPayable = enrollments.reduce((sum, e) => sum + Number(e.feeAmount ?? 0), 0);
  const totalPaid = enrollments.reduce((sum, e) => sum + Number(e.totalPaid ?? 0), 0);
  const totalDue = enrollments.reduce((sum, e) => sum + Number(e.dueAmount ?? 0), 0);
  const lastPayment = payments.length > 0 ? payments[0] : null;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Payable"
          value={fmt(totalPayable)}
          color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Total Paid"
          value={fmt(totalPaid)}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Total Due"
          value={fmt(totalDue)}
          color={totalDue > 0 ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}
        />
        <SummaryCard
          icon={<Receipt className="h-5 w-5" />}
          label="Transactions"
          value={String(payments.length)}
          color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
        />
      </div>

      {/* Due courses */}
      {totalDue > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                You have {fmt(totalDue)} due across {enrollments.filter((e) => Number(e.dueAmount) > 0).length} course(s)
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Please clear your due balance to avoid interruption to your course access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <PaymentHistoryClient payments={payments} />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
