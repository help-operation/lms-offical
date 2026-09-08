import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ToasterProvider } from "@/shared/providers/ToasterProvider";
import { buildFontLinks } from "@/shared/utils/font-registry";
import "./globals.css";

const getSiteSettings = unstable_cache(
  async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(
        `${apiUrl}/system-settings/public?keys=general_site_name,general_favicon_url`,
      );
      if (!res.ok) return null;
      const json = await res.json();
      return (json?.data ?? json) as Record<string, string>;
    } catch {
      return null;
    }
  },
  ["admin-site-settings"],
  { revalidate: 300, tags: ["general-settings"] },
);

export async function generateMetadata(): Promise<Metadata> {
  const settings  = await getSiteSettings();
  const siteName  = settings?.general_site_name  || "Skillkoro";
  const faviconUrl = settings?.general_favicon_url || null;

  return {
    title: {
      default:  `${siteName} Admin`,
      template: `%s | ${siteName} Admin`,
    },
    description: `${siteName} — Admin Panel`,
    icons: faviconUrl
      ? { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontCdnLinks = buildFontLinks("Poppins", "Hind Siliguri");

  return (
    <html lang="en">
      <head>
        {fontCdnLinks.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {/* Geist fonts via CDN */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap" />
      </head>
      <body className="antialiased">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
