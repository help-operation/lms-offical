import { apiRequest } from "@/lib/api-client";
import type { MenusGrouped } from "../types";

export const menusAdminApi = {
  getAll: () => apiRequest<MenusGrouped>("/menus/admin"),
};
