import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Join as Instructor Page" };

export default async function JoinAsInstructorContentPage() {
  const res = await pageSectionsAdminApi.getByPage("join-as-instructor").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="join-as-instructor"
      pageTitle="Join as Instructor"
      pageDescription="Manage the title and subtitle shown at the top of the /join-as-instructor page."
    />
  );
}
