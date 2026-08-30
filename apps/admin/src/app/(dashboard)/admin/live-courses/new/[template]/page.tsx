import { notFound } from "next/navigation";
import { TEMPLATES } from "@/features/live-courses/templates";
import { LiveCourseEditor } from "@/features/live-courses/LiveCourseEditor";

export const metadata = { title: "New Live Course" };

export default async function NewLiveCourseEditorPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  const tpl = TEMPLATES.find((t) => t.id === template);
  if (!tpl) notFound();

  return <LiveCourseEditor mode="create" templateId={tpl.id} />;
}
