import "server-only"
import type { FormScope, TeamForm } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptForm } from "./oracle-map"

function isDev(): boolean {
  return process.env.NODE_ENV !== "production"
}

function emptyForm(): TeamForm {
  return { team: "—", matches: [], btts_pct: null, avg_gf: null, avg_ga: null }
}

export async function getTeamForm(id: string, scope: FormScope, count: number): Promise<TeamForm> {
  if (!isOracleConfigured()) return emptyForm()
  try {
    const data = await oracleFetch<unknown>(
      `/team/${encodeURIComponent(id)}/form?scope=${scope}&count=${count}`,
    )
    if (isDev()) console.log(`[oracle] /team/${id}/form received`)
    return adaptForm(data)
  } catch (err) {
    console.error("getTeamForm: Oracle unavailable")
    if (isDev() && err instanceof Error) console.error(err.message)
    return emptyForm()
  }
}
