import { apiRequest } from "@/lib/api-client";

export interface CourseInterest {
  id: number;
  userId: number;
  courseId: number | null;
  liveCourseId: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  courseTitle: string;
  courseSlug: string;
  courseType: "recorded" | "live";
}

export interface InterestsResponse {
  data: CourseInterest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const interestsAdminApi = {
  list: (params?: {
    search?: string;
    courseId?: number;
    liveCourseId?: number;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search)       q.set("search",       params.search);
    if (params?.courseId)     q.set("courseId",     String(params.courseId));
    if (params?.liveCourseId) q.set("liveCourseId", String(params.liveCourseId));
    if (params?.page)         q.set("page",         String(params.page));
    if (params?.limit)        q.set("limit",        String(params.limit));
    const qs = q.toString();
    return apiRequest<InterestsResponse>(`/admin/interests${qs ? `?${qs}` : ""}`);
  },
};
