import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { BlogLikeToggle, BlogComment } from "./index";

export const blogApiBrowser = {
  toggleLike: (postId: number) =>
    apiRequestBrowser<BlogLikeToggle>(`/blog/${postId}/like`, { method: "POST" }),

  createComment: (postId: number, data: { content: string; parentId?: number }) =>
    apiRequestBrowser<BlogComment>(`/blog/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteComment: (postId: number, commentId: number) =>
    apiRequestBrowser<{ success: boolean }>(`/blog/${postId}/comments/${commentId}`, {
      method: "DELETE",
    }),
};
