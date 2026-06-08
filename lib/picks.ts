import "server-only"
import type { UserPick } from "./extra-types"
import { isOracleConfigured, oracleFetch, oracleMutate } from "./oracle"
import { adaptUserPicks } from "./oracle-map"

function mockPicks(): UserPick[] {
  const d = (o: number) => new Date(Date.now() + o * 864e5).toISOString().slice(0, 10)
  return [
    { id: "p1", event_id: "e1", date: d(-6), home: "Arsenal", away: "Chelsea", league: "Premier League", bet_type: "OVER_1_5", bet_side: "O1.5", odds: 1.3, stake: 20, status: "won" },
    { id: "p2", event_id: "e2", date: d(-5), home: "Inter", away: "Milan", league: "Serie A", bet_type: "BTTS", bet_side: "TAK", odds: 1.8, stake: 20, status: "won" },
    { id: "p3", event_id: "e3", date: d(-3), home: "Lyon", away: "Nice", league: "Ligue 1", bet_type: "MIX", bet_side: "BTTS+O1.5", odds: 1.9, stake: 20, status: "lost" },
    { id: "p4", event_id: "e4", date: d(2), home: "FC Tokyo", away: "Cerezo Osaka", league: "J1 League", bet_type: "OVER_1_5", bet_side: "O1.5", odds: 1.3, stake: 20, status: "pending" },
  ]
}

export async function getUserPicks(telegramId: string): Promise<UserPick[]> {
  if (!isOracleConfigured()) return mockPicks()
  try {
    const data = await oracleFetch<unknown>(`/user/${encodeURIComponent(telegramId)}/picks`, 0)
    console.log(`[oracle] /user/${telegramId}/picks raw:`, JSON.stringify(data).slice(0, 500))
    return adaptUserPicks(data)
  } catch (err) {
    console.error("getUserPicks: Oracle niedostępne →", err)
    return []
  }
}

type NewPick = { event_id: string | number; bet_type: string; bet_side: string; odds: number; stake: number }

export async function saveUserPicks(telegramId: string, picks: NewPick[]): Promise<boolean> {
  if (!isOracleConfigured()) return true // podgląd: udajemy sukces
  try {
    await oracleMutate(`/user/${encodeURIComponent(telegramId)}/picks`, "POST", { picks })
    return true
  } catch (err) {
    console.error("saveUserPicks:", err)
    return false
  }
}

export async function deleteUserPick(telegramId: string, pickId: string): Promise<boolean> {
  if (!isOracleConfigured()) return true
  try {
    await oracleMutate(`/user/${encodeURIComponent(telegramId)}/picks/${encodeURIComponent(pickId)}`, "DELETE")
    return true
  } catch (err) {
    console.error("deleteUserPick:", err)
    return false
  }
}
