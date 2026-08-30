import { notFound } from "next/navigation";
import { adminApi } from "@/features/admin/api";
import { UserDetailClient } from "@/features/admin/UserDetailClient";

export const metadata = { title: "User Profile" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (!Number.isFinite(numericId) || numericId <= 0) notFound();

  const res = await adminApi.getUser(numericId).catch(() => null);
  if (!res?.data) notFound();

  return <UserDetailClient user={res.data} />;
}
