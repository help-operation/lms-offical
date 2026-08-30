import { adminApi } from "@/features/admin/api";
import { PaymentListClient } from "@/features/admin/payments/PaymentListClient";

export const metadata = { title: "Failed Payment" };

export default async function FailedPaymentPage() {
  const res = await adminApi.failedPayments().catch(() => null);
  return <PaymentListClient title="Failed Payment" records={res?.data ?? []} status="failed" />;
}
