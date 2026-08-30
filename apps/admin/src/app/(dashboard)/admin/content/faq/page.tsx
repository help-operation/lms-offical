import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "FAQ Page Content" };

export default async function FAQContentPage() {
  const res = await pageSectionsAdminApi.getByPage("faq").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="faq"
      pageTitle="FAQ Page"
      pageDescription="Manage the FAQ hero and question categories shown on the FAQ page."
    />
  );
}
