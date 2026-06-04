import { NextResponse } from "next/server"

// TYMCZASOWY endpoint diagnostyczny połączenia z Oracle.
// Pokazuje co serwer Vercela widzi — NIE ujawnia klucza API (tylko czy jest i jego długość).
// Po zdiagnozowaniu można go usunąć.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function probe(url: string, headers: Record<string, string>) {
  const started = Date.now()
  try {
    const res = await fetch(url, { headers, cache: "no-store" })
    const text = await res.text()
    return { ok: res.ok, status: res.status, ms: Date.now() - started, body: text.slice(0, 300) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e), ms: Date.now() - started }
  }
}

export async function GET() {
  const base = process.env.ORACLE_API_URL
  const key = process.env.ORACLE_API_KEY

  const out: Record<string, unknown> = {
    oracle_url_set: Boolean(base),
    oracle_url: base ?? null, // IP/host — nie sekret
    oracle_key_set: Boolean(key),
    oracle_key_len: key ? key.length : 0,
    node_env: process.env.NODE_ENV,
    checks: {} as Record<string, unknown>,
  }

  if (base) {
    const clean = base.replace(/\/$/, "")
    ;(out.checks as Record<string, unknown>).health = await probe(`${clean}/health`, {})
    ;(out.checks as Record<string, unknown>).tips = await probe(
      `${clean}/public-api/tips/today`,
      key ? { "X-API-Key": key } : {},
    )
  }

  return NextResponse.json(out)
}
