import "server-only"

export function isPreviewDemoMode(): boolean {
  if (process.env.VERCEL_ENV === "production") return false
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"
}
