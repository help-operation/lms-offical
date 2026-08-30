import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { CartItem } from "./index";

export const cartApiBrowser = {
  getCart: () => apiRequestBrowser<CartItem[]>("/cart"),
  addToCart: (courseId: number) =>
    apiRequestBrowser<{ id: number }>(`/cart/${courseId}`, { method: "POST" }),
  removeFromCart: (courseId: number) =>
    apiRequestBrowser<{ removed: boolean }>(`/cart/${courseId}`, { method: "DELETE" }),
  clearCart: () => apiRequestBrowser<{ cleared: boolean }>("/cart", { method: "DELETE" }),
};
