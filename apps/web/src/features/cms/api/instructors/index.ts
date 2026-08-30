import { publicApiRequest } from "@/lib/api-client";

export type PublicInstructor = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  expertise: string | null;
  totalStudents: number;
  totalCourses: number;
  rating: string | null;
};

export async function getPublicInstructors(): Promise<PublicInstructor[]> {
  const res = await publicApiRequest<PublicInstructor[]>("/instructors", {
    next: { revalidate: 3600, tags: ["instructors"] },
  }).catch(() => null);
  return res?.data ?? [];
}
