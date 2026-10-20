import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, ...(process.env.SITE_URL ? { sitemap: `${process.env.SITE_URL.replace(/\/$/, "")}/sitemap.xml` } : {}) };
}
