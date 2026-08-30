import { DashboardV2Client } from "@/features/admin/dashboard-v2/DashboardV2Client";

export const metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <DashboardV2Client />;
}
