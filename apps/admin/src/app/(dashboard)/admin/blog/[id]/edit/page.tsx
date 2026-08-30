import { notFound } from "next/navigation";
import { blogAdminApi } from "@/features/blog/api";
import { BlogPostForm } from "@/features/blog/BlogPostForm";

export const metadata = { title: "Edit Post" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;

  const [postRes, catRes] = await Promise.all([
    blogAdminApi.getById(Number(id)).catch(() => null),
    blogAdminApi.categories().catch(() => null),
  ]);

  if (!postRes?.data) notFound();

  return (
    <BlogPostForm
      mode="edit"
      post={postRes.data}
      categories={catRes?.data ?? []}
    />
  );
}
