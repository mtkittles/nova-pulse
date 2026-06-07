import { NextResponse } from "next/server"
import crypto from "crypto"
import { completeToken } from "@/lib/kv-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/auth/callback — webhook wołany przez bota na Oracle.
// Bot przy obsłudze /start lb_<token> dzwoni tutaj z:
//   nagłówek: X-Bot-Secret: <BOT_CALLBACK_SECRET>
//   body JSON: { token, telegram_id, first_name?, last_name?, username? }
export async function POST(req: Request) {
  const expected = process.env.BOT_CALLBACK_SECRET
  if (!expected) {
    return NextResponse.json({ error: "Brak BOT_CALLBACK_SECRET" }, { status: 500 })
  }
  const got = req.headers.get("x-bot-secret") || ""
  // porównanie stałoczasowe (gdy długości się zgadzają)
  if (
    got.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "Niewłaściwy sekret" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Zły JSON" }, { status: 400 })
  }
  const token = String(body.token ?? "")
  const uid = String(body.telegram_id ?? body.uid ?? "")
  if (!token || !uid) {
    return NextResponse.json({ error: "Brak token/telegram_id" }, { status: 400 })
  }

  const name = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || undefined
  const username = typeof body.username === "string" ? body.username : undefined

  const ok = await completeToken(token, { uid, username, name })
  if (!ok) {
    return NextResponse.json({ error: "Token wygasł lub jest nieprawidłowy" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
