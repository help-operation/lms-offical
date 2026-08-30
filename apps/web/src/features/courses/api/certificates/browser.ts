import { apiRequestBrowser } from "@/lib/api-client-browser";
import type { ClaimedCertificate } from "./index";

export const certificatesApiBrowser = {
  claim: (courseId: number) =>
    apiRequestBrowser<ClaimedCertificate>(
      `/certificates/claim/${courseId}`,
      { method: "POST" },
    ),

  claimLive: (liveCourseId: number) =>
    apiRequestBrowser<ClaimedCertificate>(
      `/certificates/claim-live/${liveCourseId}`,
      { method: "POST" },
    ),
};
