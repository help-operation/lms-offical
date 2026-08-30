import { notFound } from "next/navigation";
import { fetchLiveCourseAction } from "@/features/live-courses/actions/live-courses.actions";
import { LiveCourseEditor } from "@/features/live-courses/LiveCourseEditor";

export const metadata = { title: "Edit Live Course" };

export default async function EditLiveCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetchLiveCourseAction(Number(id));
  if (!res.data) notFound();

  const templateMap: Record<string, string> = { "1": "mastery", "2": "sales", "3": "membership", "4": "nexemy", "5": "masterclass", "6": "medical" };
  const templateId = templateMap[res.data.template] ?? "mastery";

  return <LiveCourseEditor mode="edit" templateId={templateId} course={res.data} />;
}
