import { NextResponse } from "next/server"
import { checkToken, consumeToken } from "@/lib/login-tokens"
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth"

export const runtime = "nodejs"

// GET /api/auth/check?token=<uuid> — przeglądarka odpytuje co 2s po kliknięciu przycisku.
// pending  → {ok:false}
// confirmed → tworzy sesję JWT, zwraca {ok:true, redirect:"/stats"}
// expired  → {ok:false, expired:true}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const result = await checkToken(token)

  if (result.status === "notfound" || result.status === "expired") {
    return NextResponse.json({ ok: false, expired: result.status === "expired" })
  }

  if (result.status === "pending") {
    return NextResponse.json({ ok: false })
  }

  // confirmed — wystawiamy sesję i zużywamy token
  const { telegram_id, first_name, last_name, username } = result
  const name = [first_name, last_name].filter(Boolean).join(" ").trim() || undefined
  const jwt = await signSession({ uid: String(telegram_id), username, name })

  await consumeToken(token)

  const res = NextResponse.json({ ok: true, redirect: "/stats" })
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
