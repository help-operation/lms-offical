import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { SitePage } from "./index";

export const pagesAdminApiBrowser = {
  update: (slug: string, content: string) =>
    apiRequestBrowser<SitePage>(`/pages/${slug}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
};
