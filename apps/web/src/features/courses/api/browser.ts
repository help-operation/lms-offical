import { apiRequestBrowser } from "@/lib/api-client-browser";

export const coursesApiBrowser = {
  submitReview: (courseId: number, data: { rating: number; comment?: string }) =>
    apiRequestBrowser<null>(`/courses/${courseId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
