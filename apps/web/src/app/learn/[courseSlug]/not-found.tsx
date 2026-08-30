import { NotFoundState } from "@/shared/components/NotFoundState";

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
      <NotFoundState
        title="Lesson not found"
        message="This course or lesson isn't available, or you may not have access."
        homeHref="/courses"
        homeLabel="Browse courses"
      />
    </div>
  );
}
