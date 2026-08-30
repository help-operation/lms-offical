import { instructorApplicationsApi } from "@/features/instructor-applications/api";
import { InstructorApplicationsManager } from "@/features/instructor-applications/InstructorApplicationsManager";

export const metadata = { title: "Instructor Applications" };

export default async function InstructorApplicationsPage() {
  const res = await instructorApplicationsApi.getAll().catch(() => null);
  const initial = res?.data ?? [];

  return <InstructorApplicationsManager initial={initial} />;
}
