import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Hind_Siliguri } from "next/font/google";
import { unstable_cache } from "next/cache";
import { ToasterProvider } from "@/shared/providers/ToasterProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const hindSiliguri = Hind_Siliguri({ variable: "--font-hind-siliguri", subsets: ["bengali", "latin"], weight: ["400", "600", "700"] });

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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${hindSiliguri.variable} antialiased`}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
