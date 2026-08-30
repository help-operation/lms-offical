import { redirect } from "next/navigation";
import { settingsApi } from "@/features/settings/api";
import { SettingsClient } from "@/features/settings/SettingsClient";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const res = await settingsApi.get().catch(() => null);
  if (!res?.data) redirect("/");
  return <SettingsClient initial={res.data} />;
}
