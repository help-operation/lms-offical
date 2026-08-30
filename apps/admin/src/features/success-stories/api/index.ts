import { apiRequest } from "@/lib/api-client";
import type { SuccessStory } from "../types";

export const successStoriesAdminApi = {
  getAll: () => apiRequest<SuccessStory[]>("/success-stories/admin"),
};
