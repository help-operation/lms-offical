import { blogAdminApi } from "@/features/blog/api";
import { BlogCategoriesManager } from "@/features/blog/BlogCategoriesManager";

export const metadata = { title: "Blog Categories" };

export default async function BlogCategoriesPage() {
  const res = await blogAdminApi.categories().catch(() => null);
  const initial = res?.data ?? [];

  return <BlogCategoriesManager initial={initial} />;
}
