import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Success Stories" };

export default async function SuccessStoriesContentPage() {
  const res = await pageSectionsAdminApi.getByPage("success-stories").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="success-stories"
      pageTitle="Success Stories"
      pageDescription="Manage the public /success-stories page — text + video reviews and filter tabs."
    />
  );
}
