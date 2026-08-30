import { NotFoundState } from "@/shared/components/NotFoundState";

export default function NotFound() {
  return (
    <NotFoundState
      title="Live course not found"
      message="This live course doesn't exist or has been deleted."
      homeHref="/admin/live-courses"
      homeLabel="Back to live courses"
    />
  );
}
