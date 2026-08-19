import { NextResponse } from "next/server"
import { isOracleConfigured, oracleFetch } from "@/lib/oracle"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// TYMCZASOWY endpoint diagnostyczny — do usunięcia po zakończeniu śledztwa
// (raporty/DIAGNOZA_frontend_brak_danych_mecz.md). Zwraca SUROWĄ odpowiedź
// Oracle (bez adaptera) dla /match/{id}/detailed, żeby porównać realny
// kształt JSON z tym, czego oczekuje adaptMatchDetailed() w lib/oracle-map.ts.
// Klucz API zostaje server-side (oracleFetch) — nic tajnego nie wraca w body.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isOracleConfigured()) {
    return NextResponse.json({ error: "Oracle nie skonfigurowane w tym środowisku." }, { status: 500 })
  }
  try {
    const detailed = await oracleFetch<unknown>(`/match/${encodeURIComponent(id)}/detailed`)
    return NextResponse.json({ detailed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
