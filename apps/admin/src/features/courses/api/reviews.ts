import { apiRequest } from "@/lib/api-client";

export type ReviewSource = "student" | "admin_curated";
export type ReviewType = "text" | "video";

export interface CourseReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string | null;
  source: ReviewSource;
  reviewType: ReviewType;
  videoUrl: string | null;
  videoThumbnail: string | null;
  // student rows
  userId: number | null;
  userFirstName: string | null;
  userLastName: string | null;
  userAvatar: string | null;
  // curated rows
  displayName: string | null;
  displayRole: string | null;
  displayAvatar: string | null;
}

export interface CourseReviewsResponse {
  avg: number;
  total: number;
  distribution: Record<string, number>;
  reviews: CourseReview[];
}

export type CreateCuratedReviewPayload = {
  rating: number;
  reviewType: ReviewType;
  displayName: string;
  displayRole?: string | null;
  displayAvatar?: string | null;
  comment?: string | null;
  videoUrl?: string | null;
  videoThumbnail?: string | null;
};

export type UpdateCuratedReviewPayload = Partial<CreateCuratedReviewPayload>;

export const courseReviewsAdminApi = {
  list: (courseId: number) =>
    apiRequest<CourseReviewsResponse>(`/admin/courses/${courseId}/reviews`),

  create: (courseId: number, data: CreateCuratedReviewPayload) =>
    apiRequest<CourseReview>(`/admin/courses/${courseId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (reviewId: number, data: UpdateCuratedReviewPayload) =>
    apiRequest<CourseReview>(`/admin/courses/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (reviewId: number) =>
    apiRequest<{ deleted: boolean }>(`/admin/courses/reviews/${reviewId}`, {
      method: "DELETE",
    }),
};
