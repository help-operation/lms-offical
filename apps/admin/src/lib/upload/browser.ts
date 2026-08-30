import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { BunnyCredentials, ThumbnailUploadResponse } from "./index";

export const uploadApiBrowser = {
  getBunnyCredentials: (lessonId: number) =>
    apiRequestBrowser<BunnyCredentials>(
      `/course-builder/lessons/${lessonId}/bunny-credentials`,
      { method: "POST" }
    ),

  setExternalUrl: (lessonId: number, url: string) =>
    apiRequestBrowser<{ videoSource: string; externalVideoUrl: string }>(
      `/course-builder/lessons/${lessonId}/external-url`,
      {
        method: "POST",
        body: JSON.stringify({ url }),
      }
    ),

  getThumbnailUploadUrl: () =>
    apiRequestBrowser<ThumbnailUploadResponse>(
      `/course-builder/upload/thumbnail`,
      { method: "POST" }
    ),
};
