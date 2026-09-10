import { interestsAdminApi } from "@/features/interests/api";
import { InterestsClient } from "@/features/interests/InterestsClient";
import { getRecordedCourseOptionsAction, getLiveCourseOptionsAction } from "@/features/enrollments/actions";

export const metadata = { title: "Course Interests" };

interface Props {
  searchParams: Promise<{
    search?: string;
    courseId?: string;
    liveCourseId?: string;
    page?: string;
  }>;
}

export default async function AdminInterestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = sp.page ? parseInt(sp.page) : 1;

  const [listRes, recordedRes, liveRes] = await Promise.all([
    interestsAdminApi
      .list({
        search:       sp.search,
        courseId:     sp.courseId     ? parseInt(sp.courseId)     : undefined,
        liveCourseId: sp.liveCourseId ? parseInt(sp.liveCourseId) : undefined,
        page,
        limit: 25,
      })
      .catch(() => null),
    getRecordedCourseOptionsAction(),
    getLiveCourseOptionsAction(),
  ]);

  const initial = listRes?.data ?? {
    data: [],
    pagination: { page: 1, limit: 25, total: 0, totalPages: 1 },
  };

  const recordedCourses = recordedRes.success ? recordedRes.data : [];
  const liveCourses     = liveRes.success     ? liveRes.data     : [];

  return (
    <div>
      <InterestsClient
        initial={initial}
        recordedCourses={recordedCourses}
        liveCourses={liveCourses}
      />
    </div>
  );
}
