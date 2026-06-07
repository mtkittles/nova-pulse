import { NextResponse } from "next/server"
import crypto from "crypto"
import { isKvConfigured, reservePendingToken } from "@/lib/kv-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/auth/start
// Generuje krótki token, rezerwuje w Redis, zwraca URL deep-link do bota.
export async function GET() {
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: "Brak UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN" },
      { status: 500 },
    )
  }
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
  if (!bot) {
    return NextResponse.json({ error: "Brak NEXT_PUBLIC_TELEGRAM_BOT_USERNAME" }, { status: 500 })
  }

  // 16 bajtów base64url ≈ 22 znaki — wystarczająco losowe i krótkie dla parametru /start.
  const token = crypto.randomBytes(16).toString("base64url")
  await reservePendingToken(token)

  const url = `https://t.me/${bot}?start=lb_${token}`
  return NextResponse.json({ token, url })
}
