import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/student",
        "/guest",
        "/checkout",
        "/cart",
        "/shop/cart",
        "/shop/checkout",
        "/c/",
        "/learn/",
        "/notifications",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
