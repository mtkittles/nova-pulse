import "server-only"
import type { FormScope, TeamForm } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptForm } from "./oracle-map"

function emptyForm(): TeamForm {
  return { team: "—", matches: [], btts_pct: null, avg_gf: null, avg_ga: null }
}

export async function getTeamForm(id: string, scope: FormScope, count: number): Promise<TeamForm> {
  if (!isOracleConfigured()) return emptyForm()
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
