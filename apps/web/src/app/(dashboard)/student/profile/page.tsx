import { Metadata } from "next";
import { redirect } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { settingsApi } from "@/features/settings/api";
import { StudentProfileClient } from "@/features/profile/StudentProfileClient";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function StudentProfilePage() {
  const user = await authApi.me().catch(() => null);
  if (!user) redirect("/");
  if (user.data.role !== "STUDENT") redirect("/guest/dashboard");

  const profileRes = await settingsApi.get().catch(() => null);
  if (!profileRes?.data) redirect("/");

  return <StudentProfileClient initialProfile={profileRes.data} />;
}
