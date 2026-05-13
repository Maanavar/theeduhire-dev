import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://theeduhire.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs", "/jobs/*", "/contact", "/profile/*"],
        disallow: ["/dashboard", "/dashboard/*", "/admin", "/admin/*", "/api", "/api/*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
