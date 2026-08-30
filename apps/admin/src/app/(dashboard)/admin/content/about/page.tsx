import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "About Page Content" };

export default async function AboutContentPage() {
  const res = await pageSectionsAdminApi.getByPage("about").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="about"
      pageTitle="About Page"
      pageDescription="Manage the hero, stats, mission, team and CTA sections of the About page."
    />
  );
}
