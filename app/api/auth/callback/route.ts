import { NextResponse } from "next/server"
import { confirmToken } from "@/lib/login-tokens"

export const runtime = "nodejs"

// POST /api/auth/callback — wywoływany przez bota Oracle po deep-link /start lb_<token>.
// Weryfikuje X-Bot-Secret, oznacza token jako confirmed i zapisuje dane usera.
export async function POST(req: Request) {
  const secret = process.env.BOT_CALLBACK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Serwer nie jest skonfigurowany." }, { status: 500 })
  }

  const incoming = req.headers.get("X-Bot-Secret") ?? ""
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    token?: unknown
    telegram_id?: unknown
    first_name?: unknown
    last_name?: unknown
    username?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format danych." }, { status: 400 })
  }

  const { token, telegram_id, first_name, last_name, username } = body

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Brak pola token." }, { status: 400 })
  }

  const tid = typeof telegram_id === "number" ? telegram_id : Number(telegram_id)
  if (!tid || !isFinite(tid)) {
    return NextResponse.json({ error: "Nieprawidłowy telegram_id." }, { status: 400 })
  }

  const ok = await confirmToken(token, {
    telegram_id: tid,
    first_name: String(first_name ?? ""),
    last_name: last_name ? String(last_name) : undefined,
    username: username ? String(username) : undefined,
  })

  if (!ok) {
    return NextResponse.json({ error: "Token wygasł lub nie istnieje." }, { status: 410 })
  }

  return NextResponse.json({ ok: true })
}
