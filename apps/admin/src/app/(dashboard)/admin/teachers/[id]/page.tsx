import { notFound } from "next/navigation";
import { teachersApi } from "@/features/teachers/api";
import { TeacherDetailClient } from "@/features/teachers/TeacherDetailClient";

export const metadata = { title: "Teacher Profile" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeacherDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (!Number.isFinite(numericId) || numericId <= 0) notFound();

  const res = await teachersApi.get(numericId).catch(() => null);
  if (!res?.data) notFound();

  return <TeacherDetailClient teacher={res.data} />;
}
