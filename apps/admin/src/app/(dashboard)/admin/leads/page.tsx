import { leadsAdminApi } from "@/features/leads/api";
import { LeadsListClient } from "@/features/leads/LeadsListClient";

export const metadata = { title: "Leads" };

interface Props {
  searchParams: Promise<{
    status?: string;
    source?: string;
    paid?: string;
    search?: string;
    page?: string;
    date_from?: string;
    date_to?: string;
  }>;
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = sp.page ? parseInt(sp.page) : 1;

  const [listRes, countsRes] = await Promise.all([
    leadsAdminApi
      .list({
        status: sp.status,
        source: sp.source,
        paid: sp.paid,
        search: sp.search,
        page,
        limit: 25,
        date_from: sp.date_from,
        date_to: sp.date_to,
      })
      .catch(() => null),
    leadsAdminApi.counts().catch(() => null),
  ]);

  const leads = listRes?.data?.data ?? [];
  const pagination = listRes?.data?.pagination ?? {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  };
  const counts = countsRes?.data ?? {
    total: 0,
    pending: 0,
    complete: 0,
    paid: 0,
  };

  return (
    <div>
      <LeadsListClient leads={leads} counts={counts} pagination={pagination} />
    </div>
  );
}
