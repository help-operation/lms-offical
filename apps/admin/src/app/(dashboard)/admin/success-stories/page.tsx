import { successStoriesAdminApi } from "@/features/success-stories/api";
import { SuccessStoriesManager } from "@/features/success-stories/SuccessStoriesManager";

export const metadata = { title: "Success Stories" };

export default async function SuccessStoriesPage() {
  const res = await successStoriesAdminApi.getAll().catch(() => null);
  const initial = res?.data ?? [];

  const existingCategories = Array.from(
    new Set(initial.map((s) => s.category).filter(Boolean))
  );

  return <SuccessStoriesManager initial={initial} existingCategories={existingCategories} />;
}
