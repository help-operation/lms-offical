import { studentsApi } from "@/features/students/api";
import { StudentsClient } from "@/features/students/StudentsClient";
import { GuestsClient } from "@/features/students/GuestsClient";
import type { PaginatedResponse, Student } from "@/features/students/types";

export const metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "guests" ? "guests" : "students";

  if (activeTab === "guests") {
    const [guestsRes, guestStatsRes] = await Promise.all([
      studentsApi.listGuests({ per_page: 20 }).catch(() => null),
      studentsApi.guestStats().catch(() => null),
    ]);

    const initialGuests: PaginatedResponse<Student> = guestsRes?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };
    const initialGuestStats = guestStatsRes?.data ?? undefined;

    return <GuestsClient initialData={initialGuests} initialStats={initialGuestStats} />;
  }

  const [listRes, statsRes] = await Promise.all([
    studentsApi.list({ per_page: 20 }).catch(() => null),
    studentsApi.stats().catch(() => null),
  ]);

  const initialData = listRes?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };
  const initialStats = statsRes?.data ?? undefined;

  return <StudentsClient initialData={initialData} initialStats={initialStats} />;
}
