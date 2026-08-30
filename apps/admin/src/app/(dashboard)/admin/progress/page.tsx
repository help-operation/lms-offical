import { getStudentProgressAction } from "@/features/student-progress/actions";
import { StudentProgressClient } from "@/features/student-progress/StudentProgressClient";

export const metadata = { title: "Student Progress" };

export default async function ProgressPage() {
  const res = await getStudentProgressAction({ page: 1, per_page: 15 });
  const initial = res.success
    ? res.data
    : {
        data: [],
        pagination: { total: 0, per_page: 15, current_page: 1, last_page: 0, from: 0, to: 0 },
        stats: { active: 0, completed: 0, atRisk: 0 },
      };

  return <StudentProgressClient initial={initial} />;
}
