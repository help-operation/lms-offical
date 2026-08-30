import { pagesAdminApi } from "@/features/pages/api";
import { PageEditor } from "@/features/pages/PageEditor";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPolicyPage() {
  const res = await pagesAdminApi.get("privacy-policy").catch(() => null);

  return (
    <PageEditor
      slug="privacy-policy"
      title="Privacy Policy"
      initialContent={res?.data.content ?? ""}
    />
  );
}
