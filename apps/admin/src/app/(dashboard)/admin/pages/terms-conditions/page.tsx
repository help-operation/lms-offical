import { pagesAdminApi } from "@/features/pages/api";
import { PageEditor } from "@/features/pages/PageEditor";

export const metadata = { title: "Terms & Conditions" };

export default async function TermsConditionsPage() {
  const res = await pagesAdminApi.get("terms-conditions").catch(() => null);

  return (
    <PageEditor
      slug="terms-conditions"
      title="Terms & Conditions"
      initialContent={res?.data.content ?? ""}
    />
  );
}
