import { apiRequest } from "@/lib/api-client";

export interface BunnyCredentials {
  tusEndpoint: string;
  authorizationSignature: string;
  authorizationExpire: number;
  videoId: string;
  libraryId: string;
  title: string;
}

export interface ThumbnailUploadResponse {
  presignedUrl: string;
  publicUrl: string;
}

export const uploadApi = {
  getBunnyCredentials: (lessonId: number) =>
    apiRequest<BunnyCredentials>(`/course-builder/lessons/${lessonId}/bunny-credentials`, {
      method: "POST",
    }),

  setExternalUrl: (lessonId: number, url: string, duration?: number) =>
    apiRequest<{ videoSource: string; externalVideoUrl: string }>(
      `/course-builder/lessons/${lessonId}/external-url`,
      {
        method: "POST",
        body: JSON.stringify({ url, duration }),
      }
    ),

  getThumbnailUploadUrl: () =>
    apiRequest<ThumbnailUploadResponse>(
      `/course-builder/upload/thumbnail`,
      { method: "POST" }
    ),
};
