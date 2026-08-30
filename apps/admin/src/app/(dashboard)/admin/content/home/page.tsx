import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Landing Page Content" };

export default async function HomeContentPage() {
  const res = await pageSectionsAdminApi.getByPage("home").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="home"
      pageTitle="Landing Page"
      pageDescription="Manage all sections of the public home / landing page."
    />
  );
}
