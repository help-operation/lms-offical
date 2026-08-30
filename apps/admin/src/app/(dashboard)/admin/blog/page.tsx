import { blogAdminApi } from "@/features/blog/api";
import { BlogPostsClient } from "@/features/admin/BlogPostsClient";

export const metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const res = await blogAdminApi.list({ per_page: 20 }).catch(() => null);
  const initialData = res?.data ?? { data: [], pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 } };

  return (
    <div className="space-y-6">
      <BlogPostsClient initialData={initialData} />
    </div>
  );
}
