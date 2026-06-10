import "server-only"
import type { FormScope, TeamForm } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptForm } from "./oracle-map"

function emptyForm(): TeamForm {
  return { team: "—", matches: [], btts_pct: null, avg_gf: null, avg_ga: null }
}

// Dane testowe formy (gdy brak Oracle) — z gf/ga, by tabela rynków miała co liczyć.
function mockForm(scope: FormScope, count: number): TeamForm {
  const base = [
    { gf: 2, ga: 1, opp: "Cerezo Osaka", home: true },
    { gf: 0, ga: 0, opp: "Kashima Antlers", home: false },
    { gf: 3, ga: 2, opp: "Urawa Reds", home: true },
    { gf: 1, ga: 2, opp: "Gamba Osaka", home: false },
    { gf: 2, ga: 0, opp: "Sanfrecce", home: true },
    { gf: 1, ga: 1, opp: "Kawasaki", home: false },
    { gf: 4, ga: 1, opp: "Nagoya", home: true },
    { gf: 0, ga: 3, opp: "Yokohama FM", home: false },
    { gf: 2, ga: 2, opp: "Vissel Kobe", home: true },
    { gf: 1, ga: 0, opp: "Avispa", home: false },
    { gf: 3, ga: 3, opp: "Shonan", home: true },
    { gf: 2, ga: 1, opp: "Kyoto", home: false },
    { gf: 0, ga: 1, opp: "Machida", home: true },
    { gf: 5, ga: 0, opp: "Niigata", home: false },
    { gf: 1, ga: 1, opp: "Tosu", home: true },
  ]
  const sliced = base
    .filter((m) => (scope === "home" ? m.home : scope === "away" ? !m.home : true))
    .slice(0, count)
  const matches = sliced.map((m, i) => ({
    result: (m.gf > m.ga ? "W" : m.gf < m.ga ? "L" : "D") as "W" | "D" | "L",
    opponent: m.opp,
    score: `${m.gf}:${m.ga}`,
    date: new Date(Date.now() - (i + 1) * 7 * 864e5).toISOString().slice(0, 10),
    gf: m.gf,
    ga: m.ga,
    home: m.home,
  }))
  const n = matches.length || 1
  return {
    team: "FC Tokyo",
    matches,
    btts_pct: Math.round((matches.filter((m) => m.gf > 0 && m.ga > 0).length / n) * 100),
    avg_gf: +(matches.reduce((a, m) => a + m.gf, 0) / n).toFixed(2),
    avg_ga: +(matches.reduce((a, m) => a + m.ga, 0) / n).toFixed(2),
  }
}

export async function getTeamForm(id: string, scope: FormScope, count: number): Promise<TeamForm> {
  if (!isOracleConfigured()) return mockForm(scope, count)
  try {
    const data = await oracleFetch<unknown>(
      `/team/${encodeURIComponent(id)}/form?scope=${scope}&count=${count}`,
    )
    console.log(`[oracle] /team/${id}/form raw:`, JSON.stringify(data).slice(0, 500))
    return adaptForm(data)
  } catch (err) {
    console.error("getTeamForm: Oracle niedostępne →", err)
    return emptyForm()
  }
}
