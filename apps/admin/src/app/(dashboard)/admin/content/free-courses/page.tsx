import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Free Courses" };

export default async function FreeCoursesContentPage() {
  const res = await pageSectionsAdminApi.getByPage("free-courses").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="free-courses"
      pageTitle="Free Courses"
      pageDescription="Manage the public /free-courses page — hero, coming-soon card, recorded courses carousel."
    />
  );
}
