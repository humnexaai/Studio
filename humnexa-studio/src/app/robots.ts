import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/studio/",
          "/api/",
          "/auth/callback",
          "/onboarding/",
          "/billing/",
          "/settings/",
          "/admin/",
        ],
      },
    ],
    sitemap: "https://studio.humnexa.com/sitemap.xml",
  };
}
