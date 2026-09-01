import { paymentsApi } from "@/features/admin/payments/api";
import { PaymentManagementClient } from "@/features/admin/payments/PaymentManagementClient";

export const dynamic = "force-dynamic";

export default async function PaymentManagementPage() {
  let stats = null;
  let courses: { id: number; title: string }[] = [];

  try {
    const [statsRes, coursesRes] = await Promise.all([
      paymentsApi.stats(),
      paymentsApi.courses(),
    ]);
    stats = statsRes.data;
    courses = coursesRes.data;
  } catch {
    // render with empty data; client will show error/empty states
  }

  return <PaymentManagementClient initialStats={stats} courseList={courses} />;
}
