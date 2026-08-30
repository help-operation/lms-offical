import { apiRequest } from "@/lib/api-client";

export interface CartItem {
  id: number;
  addedAt: string | null;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  courseLevel: "beginner" | "intermediate" | "advanced";
  price: string;
  discountPrice: string | null;
  instructorFirstName: string;
  instructorLastName: string;
}

export const cartApi = {
  getCart: () => apiRequest<CartItem[]>("/cart"),

  addToCart: (courseId: number) =>
    apiRequest<{ id: number }>(`/cart/${courseId}`, { method: "POST" }),

  removeFromCart: (courseId: number) =>
    apiRequest<{ removed: boolean }>(`/cart/${courseId}`, { method: "DELETE" }),

  clearCart: () => apiRequest<{ cleared: boolean }>("/cart", { method: "DELETE" }),
};
