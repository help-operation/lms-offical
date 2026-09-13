import { blogAdminApi } from "@/features/blog/api";
import { BlogTagsManager } from "@/features/blog/BlogTagsManager";

export const metadata = { title: "Blog Tags" };

export default async function BlogTagsPage() {
  const res = await blogAdminApi.tags().catch(() => null);
  const initial = res?.data ?? [];

  return <BlogTagsManager initial={initial} />;
}
