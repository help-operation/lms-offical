import { getCertificatesAction } from "@/features/certificates/actions";
import { CertificatesClient } from "@/features/certificates/CertificatesClient";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const res = await getCertificatesAction({ page: 1, perPage: 15 });
  const initial = res.success
    ? res.data
    : { data: [], pagination: { page: 1, perPage: 15, total: 0, totalPages: 0 }, stats: { total: 0, thisMonth: 0 } };

  return <CertificatesClient initial={initial} />;
}
