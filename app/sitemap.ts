import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nova-pulse-sage.vercel.app"

// Sitemap: statyczne strony + dynamiczne /mecz/[id] (ostatnie typy z Oracle).
// Oracle wołane server-side; brak/niedostępność NIE blokuje buildu (try/catch).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "")

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/typy`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/live`, priority: 0.9, changeFrequency: "always" },
    { url: `${base}/stats`, priority: 0.7, changeFrequency: "daily" },
    { url: `${base}/ranking`, priority: 0.6, changeFrequency: "daily" },
  ]

  const matchPages: MetadataRoute.Sitemap = []
  try {
    const oracle = process.env.ORACLE_API_URL
    const key = process.env.ORACLE_API_KEY
    if (oracle && key) {
      const res = await fetch(`${oracle.replace(/\/$/, "")}/public-api/tips/history?limit=50`, {
        headers: { "X-API-Key": key },
        next: { revalidate: 3600 },
      })
      if (res.ok) {
        const data = (await res.json()) as { tips?: { event_id?: string | number }[] }
        const seen = new Set<string>()
        for (const tip of data.tips ?? []) {
          const id = tip.event_id != null ? String(tip.event_id) : ""
          if (id && !seen.has(id)) {
            seen.add(id)
            matchPages.push({ url: `${base}/mecz/${id}`, priority: 0.8, changeFrequency: "weekly" })
          }
        }
      }
    }
  } catch {
    // Oracle niedostępny → sam sitemap statyczny (nie blokuj buildu)
  }

  return [...staticPages, ...matchPages]
}
