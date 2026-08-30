import { apiRequest } from "@/lib/api-client";

export interface Note {
  id: number;
  userId: number;
  lessonId: number;
  content: string;
  videoTimestamp: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AllNotesEntry {
  id: number;
  source: "recorded" | "live";
  content: string;
  createdAt: string | null;
  lessonId: number;
  lessonTitle: string;
  courseTitle: string;
  courseHref: string;
}

export const notesApi = {
  list: (lessonId: number) =>
    apiRequest<Note[]>(`/student/lessons/${lessonId}/notes`),

  listAll: () => apiRequest<AllNotesEntry[]>("/student/notes"),

  create: (lessonId: number, content: string, videoTimestamp = 0) =>
    apiRequest<Note>(`/student/lessons/${lessonId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, videoTimestamp }),
    }),

  remove: (lessonId: number, noteId: number) =>
    apiRequest<null>(`/student/lessons/${lessonId}/notes/${noteId}`, {
      method: "DELETE",
    }),
};
