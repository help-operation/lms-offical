import { notFound } from "next/navigation";
import { leadsAdminApi } from "@/features/leads/api";
import { LeadDetailClient } from "@/features/leads/LeadDetailClient";

export const metadata = { title: "Lead Detail" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (!Number.isFinite(numericId) || numericId <= 0) notFound();

  const res = await leadsAdminApi.get(numericId).catch(() => null);
  if (!res?.data) notFound();

  return <LeadDetailClient lead={res.data} />;
}
