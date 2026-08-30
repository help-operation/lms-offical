import { unstable_cache } from "next/cache";

/** Public, unauthenticated site branding — safe to call from the (auth) route group before login. */
const getPublicSiteName = unstable_cache(
  async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(`${apiUrl}/system-settings/public?keys=general_site_name`);
      if (!res.ok) return null;
      const json = await res.json();
      return (json?.data ?? json) as Record<string, string>;
    } catch {
      return null;
    }
  },
  ["admin-auth-site-name"],
  { revalidate: 300, tags: ["general-settings"] },
);

export async function getAdminAuthSiteName(): Promise<string> {
  const settings = await getPublicSiteName();
  return settings?.general_site_name || "Skillkoro";
}
