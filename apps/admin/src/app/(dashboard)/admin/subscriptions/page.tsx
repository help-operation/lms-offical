import { fetchSubscriptionsAction } from "@/features/subscriptions/actions";
import { SubscriptionsListClient } from "@/features/subscriptions/SubscriptionsListClient";

export const metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const res = await fetchSubscriptionsAction(status, page ? Number(page) : 1);

  return (
    <div className="space-y-6">
      <SubscriptionsListClient
        initialData={res.data}
        initialStatus={status}
      />
    </div>
  );
}
