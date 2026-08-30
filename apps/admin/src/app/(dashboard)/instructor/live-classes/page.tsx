import { liveClassAdminApi } from "@/features/instructor/api";
import { LiveClassesClient } from "@/features/instructor/LiveClassesClient";

export const metadata = { title: "Live Classes" };

export default async function InstructorLiveClassesPage() {
  const res = await liveClassAdminApi.mine().catch(() => null);
  const classes = res?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
      <LiveClassesClient initialClasses={classes} />
    </div>
  );
}
