import { blogAdminApi } from "@/features/blog/api";
import { BlogPostForm } from "@/features/blog/BlogPostForm";

export const metadata = { title: "New Post" };

export default async function NewBlogPostPage() {
  const catRes    = await blogAdminApi.categories().catch(() => null);
  const categories = catRes?.data ?? [];

  return <BlogPostForm mode="create" categories={categories} />;
}
