import { NextResponse } from "next/server"
import { isOracleConfigured, oracleFetch } from "@/lib/oracle"
import { LEAGUES, primeLeagueNames } from "@/lib/leagues"

export const runtime = "nodejs"
// Nazwy lig zmieniają się rzadko — cache 1h.
export const revalidate = 3600

type NameEntry = { name: string; country?: string; level?: number; flag?: string }

function localDict(): Record<string, NameEntry> {
  const d: Record<string, NameEntry> = {}
  for (const l of LEAGUES) d[l.code] = { name: l.name, country: l.country }
  return d
}

// GET /api/leagues-names — słownik {code: {name, country, level, flag}} z Oracle (141 lig).
// Fallback: lokalny słownik LEAGUES gdy Oracle nieskonfigurowane/niedostępne.
export async function GET() {
  if (!isOracleConfigured()) {
    return NextResponse.json(localDict())
  }
  try {
    const data = await oracleFetch<Record<string, NameEntry>>("/leagues/names", 3600)
    if (data && typeof data === "object") {
      primeLeagueNames(data) // zasil cache dla SSR w tym samym runtime
      return NextResponse.json(data)
    }
    return NextResponse.json(localDict())
  } catch (err) {
    console.error("/api/leagues-names: Oracle niedostępne →", err)
    return NextResponse.json(localDict())
  }
}
