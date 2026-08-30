import { pagesAdminApi } from "@/features/pages/api";
import { PageEditor } from "@/features/pages/PageEditor";

export const metadata = { title: "Return Policy" };

export default async function ReturnPolicyPage() {
  const res = await pagesAdminApi.get("return-policy").catch(() => null);

  return (
    <PageEditor
      slug="return-policy"
      title="Return Policy"
      initialContent={res?.data.content ?? ""}
    />
  );
}
