import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nova-pulse-sage.vercel.app"

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, "")
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // profil prywatny, admin i API nie indeksujemy
        disallow: ["/api/", "/admin/", "/profil"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
