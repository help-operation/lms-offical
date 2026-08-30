import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Signup Page" };

export default async function SignupContentPage() {
  const res = await pageSectionsAdminApi.getByPage("signup").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="signup"
      pageTitle="Signup Page"
      pageDescription="Manage the title and side image shown on the /signup page."
    />
  );
}
