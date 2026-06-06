import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/admin/refresh — tylko admin. Woła Oracle POST /public-api/admin/refresh
// z nagłówkiem X-Admin-Key (ADMIN_API_KEY pozostaje server-side).
export async function POST() {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 })
  }

  const base = process.env.ORACLE_API_URL
  const adminKey = process.env.ADMIN_API_KEY
  if (!base || !adminKey) {
    return NextResponse.json(
      { error: "Serwer nie skonfigurowany (ORACLE_API_URL / ADMIN_API_KEY)." },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/public-api/admin/refresh`, {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
      cache: "no-store",
    })
    const text = await res.text()
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text.slice(0, 300) }
    }
    return NextResponse.json({ ok: res.ok, status: res.status, body }, { status: res.ok ? 200 : 502 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd połączenia z Oracle." },
      { status: 502 },
    )
  }
}
