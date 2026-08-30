import { notFound } from "next/navigation";
import { studentsApi } from "@/features/students/api";
import { StudentDetailClient } from "@/features/students/StudentDetailClient";

export const metadata = { title: "Student Profile" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (!Number.isFinite(numericId) || numericId <= 0) notFound();

  const res = await studentsApi.get(numericId).catch(() => null);
  if (!res?.data) notFound();

  return <StudentDetailClient student={res.data} />;
}
