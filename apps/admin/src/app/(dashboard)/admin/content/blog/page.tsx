import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Blog Page Content" };

export default async function BlogContentPage() {
  const res = await pageSectionsAdminApi.getByPage("blog").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="blog"
      pageTitle="Blog Page"
      pageDescription="Manage the hero and content sections of the public /blog page."
    />
  );
}
