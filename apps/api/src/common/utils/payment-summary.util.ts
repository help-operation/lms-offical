import { sql, type SQL } from 'drizzle-orm';
import { enrollments, liveEnrollments, livePayments, orders, payments, users } from 'src/db/schema';

export type PaymentSummary = {
  feeAmount: string | null;
  totalPaid: string;
  dueAmount: string;
  paymentStatus: 'due' | 'partial' | 'paid' | null;
};

/**
 * Derives Paid/Partial/Due from a fee + what's actually been received.
 * `legacyFullyPaid` covers pre-installment rows (live courses paid in full
 * via gateway before `live_payments` existed) that have zero payment rows
 * to sum but should still read as fully paid.
 */
export function paymentSummaryFrom(
  feeStr: string | null,
  paidStr: string | null | undefined,
  legacyFullyPaid: boolean,
): PaymentSummary {
  if (feeStr == null) return { feeAmount: null, totalPaid: '0', dueAmount: '0', paymentStatus: null };
  const fee = Number(feeStr);
  let paid = paidStr != null ? Number(paidStr) : 0;
  if (paid <= 0 && legacyFullyPaid) paid = fee;
  const due = Math.max(0, fee - paid);
  const paymentStatus = paid <= 0 ? 'due' : due <= 0 ? 'paid' : 'partial';
  return { feeAmount: feeStr, totalPaid: String(paid), dueAmount: String(due), paymentStatus };
}

/**
 * Correlated scalar subqueries computing a student's total fee / total paid
 * across every recorded + live enrollment, at read time (no denormalized
 * column to keep in sync). Correlate on the outer `users.id` — only valid in
 * a query whose FROM/JOIN list includes `users`.
 */
export const studentTotalFeeExpr: SQL<number> = sql<number>`(
  COALESCE((
    SELECT SUM(${orders.finalAmount}) FROM ${enrollments}
    JOIN ${orders} ON ${enrollments.orderId} = ${orders.id}
    WHERE ${enrollments.userId} = ${users.id}
  ), 0)
  +
  COALESCE((
    SELECT SUM(${liveEnrollments.amount}) FROM ${liveEnrollments}
    WHERE ${liveEnrollments.userId} = ${users.id}
  ), 0)
)`;

export const studentTotalPaidExpr: SQL<number> = sql<number>`(
  COALESCE((
    SELECT SUM(${payments.amount}) FROM ${payments}
    JOIN ${enrollments} ON ${payments.orderId} = ${enrollments.orderId}
    WHERE ${enrollments.userId} = ${users.id} AND ${payments.status} = 'completed'
  ), 0)
  +
  COALESCE((
    SELECT SUM(${livePayments.amount}) FROM ${livePayments}
    JOIN ${liveEnrollments} ON ${livePayments.liveEnrollmentId} = ${liveEnrollments.id}
    WHERE ${liveEnrollments.userId} = ${users.id} AND ${livePayments.status} = 'completed'
  ), 0)
)`;

export const studentDueAmountExpr: SQL<number> = sql<number>`GREATEST(${studentTotalFeeExpr} - ${studentTotalPaidExpr}, 0)`;

/** SQL-computed 'due' | 'partial' | 'paid', mirroring `paymentSummaryFrom`'s branching. */
export const studentPaymentStatusExpr: SQL<'due' | 'partial' | 'paid'> = sql<'due' | 'partial' | 'paid'>`(
  CASE
    WHEN ${studentTotalPaidExpr} <= 0 THEN 'due'
    WHEN ${studentTotalPaidExpr} >= ${studentTotalFeeExpr} AND ${studentTotalFeeExpr} > 0 THEN 'paid'
    ELSE 'partial'
  END
)`;

/** `filterable` callback for `buildTableQuery` — matches students whose computed payment status equals `value`. */
export function studentPaymentStatusFilter(value: string): SQL {
  return sql`${studentPaymentStatusExpr} = ${value}`;
}
