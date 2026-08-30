import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Live Classes" };

export default async function LiveClassesContentPage() {
  const res = await pageSectionsAdminApi.getByPage("live-classes").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="live-classes"
      pageTitle="Live Classes"
      pageDescription="Manage the public /live-classes page — upcoming batches grid."
    />
  );
}
