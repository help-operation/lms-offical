import { myPaymentsApi } from "@/features/payments/api";
import { PaymentHistoryClient } from "@/features/payments/PaymentHistoryClient";

export const metadata = { title: "Payment History" };

export default async function PaymentHistoryPage() {
  const res = await myPaymentsApi.list().catch(() => null);
  const payments = res?.data ?? [];

  return <PaymentHistoryClient payments={payments} />;
}
