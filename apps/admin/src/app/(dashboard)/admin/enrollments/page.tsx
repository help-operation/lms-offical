import { getEnrollmentsAction } from "@/features/enrollments/actions";
import { EnrollmentsClient } from "@/features/enrollments/EnrollmentsClient";

export const metadata = { title: "Enrollments" };

export default async function EnrollmentsPage() {
  const res = await getEnrollmentsAction({ page: 1, per_page: 20 });

  const initial = res.success
    ? res.data
    : {
        data: [],
        pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 },
        stats: { total: 0, active: 0, completed: 0, thisMonth: 0 },
      };

  return <EnrollmentsClient initial={initial} />;
}
