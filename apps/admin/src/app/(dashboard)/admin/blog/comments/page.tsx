import { apiRequest } from "@/lib/api-client";
import { BlogCommentsManager, type BlogComment } from "@/features/blog/BlogCommentsManager";

export const metadata = { title: "Blog Comments" };

export default async function BlogCommentsPage() {
  const res = await apiRequest<BlogComment[]>("/blog/admin/comments").catch(() => null);
  const initial = res?.data ?? [];

  return <BlogCommentsManager initial={initial} />;
}
