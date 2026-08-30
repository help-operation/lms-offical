import { authApi } from "@/features/auth/api";
import { SettingsHubClient } from "./SettingsHubClient";

export const metadata = { title: "System Settings" };

export default async function SettingsHubPage() {
  const user = await authApi.me().catch(() => null);
  const isSuperAdmin = user?.data.role === "SUPER_ADMIN";
  const permissions = user?.data.permissions ?? [];

  return <SettingsHubClient isSuperAdmin={isSuperAdmin} permissions={permissions} />;
}
