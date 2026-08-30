import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Courses Page Content" };

export default async function CoursesContentPage() {
  const res = await pageSectionsAdminApi.getByPage("courses").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="courses"
      pageTitle="Courses Page"
      pageDescription="Manage the hero and content sections of the public /courses page."
    />
  );
}
