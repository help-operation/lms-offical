import { NotFoundState } from "@/shared/components/NotFoundState";

export default function NotFound() {
  return (
    <NotFoundState
      title="Post not found"
      message="This blog post doesn't exist or may have been removed."
      homeHref="/blog"
      homeLabel="Browse the blog"
    />
  );
}
