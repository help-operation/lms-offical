import { adminApi } from "@/features/admin/api";
import { PaymentListClient } from "@/features/admin/payments/PaymentListClient";

export const metadata = { title: "Complete Payment" };

export default async function CompletePaymentPage() {
  const res = await adminApi.completedPayments().catch(() => null);
  return <PaymentListClient title="Complete Payment" records={res?.data ?? []} status="completed" />;
}
