import { listBroadcastJobsAction } from "@/features/broadcast-jobs/actions";
import { MessageHistoryClient } from "@/features/broadcast-jobs/MessageHistoryClient";

export const metadata = { title: "Message History" };

export default async function MessageHistoryPage() {
  const jobsRes = await listBroadcastJobsAction(150);

  return (
    <MessageHistoryClient
      initialJobs={jobsRes.success ? jobsRes.data : []}
      loadError={jobsRes.success ? null : jobsRes.message}
    />
  );
}
