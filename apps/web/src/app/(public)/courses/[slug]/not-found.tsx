import { NotFoundState } from "@/shared/components/NotFoundState";

export default function NotFound() {
  return (
    <NotFoundState
      title="Course not found"
      message="This course doesn't exist or is no longer available."
      homeHref="/courses"
      homeLabel="Browse courses"
    />
  );
}
