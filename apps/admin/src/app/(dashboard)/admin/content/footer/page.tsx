import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Footer Content" };

export default async function FooterContentPage() {
  const res = await pageSectionsAdminApi.getByPage("footer").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="footer"
      pageTitle="Footer"
      pageDescription="Manage footer site info displayed at the bottom of every page."
    />
  );
}
