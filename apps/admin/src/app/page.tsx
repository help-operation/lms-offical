import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authApi } from "@/features/auth/api";

export default function RootPage() {
  return (
    <Suspense fallback={null}>
      <RootRedirect />
    </Suspense>
  );
}

async function RootRedirect() {
  const user = await authApi.me().catch(() => null);

  if (!user) redirect("/login");

  if (user.data.role === "SUPER_ADMIN") redirect("/admin/dashboard");
  if (user.data.role === "INSTRUCTOR") redirect("/instructor/dashboard");

  redirect("/login");
  return null;
}
