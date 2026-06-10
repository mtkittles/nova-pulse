"use client"

import useSWR from "swr"

export interface LiveMatch {
  event_id: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  ht_home_score: number | null
  ht_away_score: number | null
  minute: number | null
  status_short: string
  league: string
  league_code: string
  kickoff_utc: string | null
  last_live_update: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Globalny hook live — SWR deduplikuje, więc wiele kart dzieli jedno zapytanie.
export function useLiveMatches() {
  const { data, error, isLoading } = useSWR<{ matches: LiveMatch[]; updated_at: string | null }>(
    "/api/live",
    fetcher,
    {
      refreshInterval: 60000, // co 60s
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    },
  )
  return {
    liveMatches: data?.matches ?? [],
    updatedAt: data?.updated_at ?? null,
    error,
    isLoading,
  }
}

// Znajdź mecz live po event_id (porównanie po stringu).
export function findLive(list: LiveMatch[], eventId: string | number): LiveMatch | undefined {
  const id = String(eventId)
  return list.find((m) => m.event_id === id)
}

export type LiveState = "live" | "halftime" | "finished" | "other"

// Klient-owy odpowiednik mapStatus (na bazie status_short z /api/live).
export function mapLiveStatus(short: string): LiveState {
  const s = (short || "").toLowerCase().trim()
  if (s === "ht" || s.includes("halftime")) return "halftime"
  if (["aet", "ft", "pen", "awd", "wo", "fin", "end"].some((c) => s === c || s.includes(c)))
    return "finished"
  if (s === "p" || ["1h", "2h", "et", "bt", "live", "in_play", "inplay"].some((c) => s.includes(c)))
    return "live"
  return "other"
}
