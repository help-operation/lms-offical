import { notFound } from "next/navigation";
import { adminApi } from "@/features/admin/api";
import { EditStaffClient } from "@/features/admin/EditStaffClient";

export const metadata = { title: "Edit Staff" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditStaffPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (!Number.isFinite(numericId) || numericId <= 0) notFound();

  const res = await adminApi.getUser(numericId).catch(() => null);
  if (!res?.data) notFound();

  return <EditStaffClient user={res.data} />;
}
