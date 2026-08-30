import { apiRequestBrowser } from "@/lib/api-client-browser";

export const authApiBrowser = {
  // Rotates the auth cookies; the backend re-reads the current DB role,
  // so a GUEST promoted to STUDENT (after enrolling) gets an updated token.
  refresh: () =>
    apiRequestBrowser<null>("/auth/refresh", { method: "POST" }),
};
