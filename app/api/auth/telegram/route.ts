import { NextResponse } from "next/server"
import crypto from "crypto"
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth"

export const runtime = "nodejs"

// POST /api/auth/telegram
// Odbiera dane z Telegram Login Widget, weryfikuje podpis HMAC z tokenu bota,
// a po sukcesie wystawia sesję JWT w httpOnly cookie.
// Dokumentacja podpisu: https://core.telegram.org/widgets/login#checking-authorization
export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const jwtSecret = process.env.JWT_SECRET
  if (!botToken || !jwtSecret) {
    return NextResponse.json(
      { error: "Serwer nie jest skonfigurowany (brak TELEGRAM_BOT_TOKEN lub JWT_SECRET)." },
      { status: 500 },
    )
  }

  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format danych." }, { status: 400 })
  }

  const hash = typeof data.hash === "string" ? data.hash : ""
  if (!hash) {
    return NextResponse.json({ error: "Brak podpisu Telegrama." }, { status: 400 })
  }

  // data_check_string: wszystkie pola oprócz hash, posortowane, "klucz=wartość", \n
  const pairs: string[] = []
  for (const k of Object.keys(data).sort()) {
    if (k === "hash") continue
    const v = data[k]
    if (v === undefined || v === null) continue
    pairs.push(`${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
  }
  const dataCheckString = pairs.join("\n")

  const secret = crypto.createHash("sha256").update(botToken).digest()
  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex")

  const valid =
    hmac.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))
  if (!valid) {
    return NextResponse.json({ error: "Weryfikacja Telegrama nie powiodła się." }, { status: 401 })
  }

  // ochrona przed replayem — dane nie starsze niż 24h
  const authDate = Number(data.auth_date)
  if (!authDate || Date.now() / 1000 - authDate > 86400) {
    return NextResponse.json({ error: "Sesja Telegrama wygasła. Spróbuj ponownie." }, { status: 401 })
  }

  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || undefined
  const username = typeof data.username === "string" ? data.username : undefined

  const jwt = await signSession({ uid: String(data.id), username, name })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
