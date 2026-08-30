import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Mentors" };

export default async function MentorsContentPage() {
  const res = await pageSectionsAdminApi.getByPage("our-instructor").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="our-instructor"
      pageTitle="Mentors"
      pageDescription="Manage the public /our-instructor page — mentor list, hero, and reused sections."
    />
  );
}
