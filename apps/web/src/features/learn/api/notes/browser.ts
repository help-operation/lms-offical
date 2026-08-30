import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { Note } from "./index";

export type { Note };

export const notesApiBrowser = {
  list: (lessonId: number) =>
    apiRequestBrowser<Note[]>(`/student/lessons/${lessonId}/notes`),

  create: (lessonId: number, content: string, videoTimestamp = 0) =>
    apiRequestBrowser<Note>(`/student/lessons/${lessonId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, videoTimestamp }),
    }),

  update: (lessonId: number, noteId: number, content: string) =>
    apiRequestBrowser<Note>(`/student/lessons/${lessonId}/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),

  remove: (lessonId: number, noteId: number) =>
    apiRequestBrowser<null>(`/student/lessons/${lessonId}/notes/${noteId}`, {
      method: "DELETE",
    }),
};
