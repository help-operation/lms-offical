import { apiRequestBrowser } from "@/lib/api-client-browser";

export interface LiveClass {
  id: number;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: string;
  courseId: number | null;
  instructorId: number;
  instructorFirstName: string;
  instructorLastName: string;
}

export const liveClassesApi = {
  upcoming: () => apiRequestBrowser<LiveClass[]>("/live-classes"),
  rsvp: (id: number) =>
    apiRequestBrowser<{ registered: boolean }>(`/live-classes/${id}/rsvp`, {
      method: "POST",
    }),
};
