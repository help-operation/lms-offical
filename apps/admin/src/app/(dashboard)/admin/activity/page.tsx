import { getActivityLogsAction } from "@/features/activity-logs/actions";
import { ActivityLogsClient } from "@/features/activity-logs/ActivityLogsClient";

export const metadata = { title: "Activity Log" };

export default async function ActivityPage() {
  const res = await getActivityLogsAction({ page: 1 });
  const initial = res.success
    ? res.data
    : {
        data: [],
        pagination: { total: 0, per_page: 30, current_page: 1, last_page: 0, from: 0, to: 0 },
        stats: { total: 0, adminActions: 0, userActions: 0 },
      };

  return <ActivityLogsClient initial={initial} />;
}
