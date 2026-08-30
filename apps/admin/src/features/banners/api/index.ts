import { apiRequest } from "@/lib/api-client";
import type { BannersGrouped } from "../types";

export const bannersAdminApi = {
  getAll: () => apiRequest<BannersGrouped>("/banners/admin"),
};
