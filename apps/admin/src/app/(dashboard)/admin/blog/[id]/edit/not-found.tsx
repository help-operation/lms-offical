import { NotFoundState } from "@/shared/components/NotFoundState";

export default function NotFound() {
  return (
    <NotFoundState
      title="Post not found"
      message="This blog post doesn't exist or has been deleted."
      homeHref="/admin/blog"
      homeLabel="Back to posts"
    />
  );
}
