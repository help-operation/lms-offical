import type { MetadataRoute } from "next";
import { getPublicCoursesRaw, getLiveCourses } from "@/features/landing/api/landing.api";
import { getCachedBlogList } from "@/features/blog/api";
import { publicApiRequest } from "@/lib/api-client";
import type { ShopProduct } from "@/features/shop/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recordedCourses, liveCourses, blogPosts, shopRes] = await Promise.all([
    getPublicCoursesRaw(200),
    getLiveCourses(200),
    getCachedBlogList().catch(() => []),
    publicApiRequest<ShopProduct[]>("/shop/products", {
      next: { revalidate: 3600 },
    }).catch(() => null),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/free-courses`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/live-classes`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/our-instructor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/success-stories`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/join-as-instructor`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/shop`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE_URL}/return-policy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE_URL}/terms-conditions`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const courseEntries: MetadataRoute.Sitemap = recordedCourses.map((c) => ({
    url: `${BASE_URL}/courses/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Live courses are served off the root catch-all route (`/[slug]`), not `/courses/[slug]`.
  const liveCourseEntries: MetadataRoute.Sitemap = liveCourses.map((c) => ({
    url: `${BASE_URL}/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const shopEntries: MetadataRoute.Sitemap = (shopRes?.data ?? [])
    .filter((p) => p.isActive)
    .map((p) => ({
      url: `${BASE_URL}/shop/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  return [...staticEntries, ...courseEntries, ...liveCourseEntries, ...blogEntries, ...shopEntries];
}
