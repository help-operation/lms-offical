import { getAnnouncementsAction } from "@/features/announcements/actions";
import { AnnouncementsClient } from "@/features/announcements/AnnouncementsClient";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const res = await getAnnouncementsAction({ page: 1 });
  const initial = res.success
    ? res.data
    : {
        data: [],
        pagination: { total: 0, per_page: 20, current_page: 1, last_page: 0, from: 0, to: 0 },
        stats: { total: 0, active: 0 },
      };

  return <AnnouncementsClient initial={initial} />;
}
