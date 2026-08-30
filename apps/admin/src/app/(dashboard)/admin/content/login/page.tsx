import { pageSectionsAdminApi } from "@/features/page-sections/api";
import { SectionManager } from "@/features/page-sections/SectionManager";

export const metadata = { title: "Login Page" };

export default async function LoginContentPage() {
  const res = await pageSectionsAdminApi.getByPage("login").catch(() => null);
  const sections = res?.data ?? [];

  return (
    <SectionManager
      initialSections={sections}
      page="login"
      pageTitle="Login Page"
      pageDescription="Manage the title and side image shown on the /login page."
    />
  );
}
