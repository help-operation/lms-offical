import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { SuccessStory, CreateStoryPayload, UpdateStoryPayload } from "../types";

export const successStoriesApiBrowser = {
  create: (data: CreateStoryPayload) =>
    apiRequestBrowser<SuccessStory>("/success-stories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateStoryPayload) =>
    apiRequestBrowser<SuccessStory>(`/success-stories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  toggle: (id: number) =>
    apiRequestBrowser<SuccessStory>(`/success-stories/${id}/toggle`, { method: "PATCH" }),

  reorder: (items: { id: number; order: number }[]) =>
    apiRequestBrowser("/success-stories/reorder", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),

  delete: (id: number) =>
    apiRequestBrowser(`/success-stories/${id}`, { method: "DELETE" }),
};
