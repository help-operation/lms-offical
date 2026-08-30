import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Contact Page Content" };

export default async function ContactContentPage() {
  const res = await pageSectionsAdminApi.getByPage("contact").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="contact"
      pageTitle="Contact Page"
      pageDescription="Manage the hero and contact information shown on the Contact page."
    />
  );
}
