import { NextResponse } from "next/server"
import { consumeToken } from "@/lib/kv-auth"
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/auth/poll?token=<token>
// Przeglądarka pyta cyklicznie. Gdy bot odda callback → wystaw cookie sesji.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || ""
  if (!token) return NextResponse.json({ error: "Brak token" }, { status: 400 })

  const payload = await consumeToken(token)
  if (!payload) {
    return NextResponse.json({ status: "pending" })
  }

  const jwt = await signSession(payload)
  const res = NextResponse.json({ status: "done" })
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
