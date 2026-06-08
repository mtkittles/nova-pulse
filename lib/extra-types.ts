import type { BetType } from "./types"

export type FormScope = "all" | "home" | "away"

export interface CalendarDay {
  date: string // YYYY-MM-DD
  tips: number // -1 = są typy, liczba nieznana
  matches: number
  leagues: number
}

export interface MatchPrediction {
  bet_type: BetType
  bet_side: string
  model_prob: number
  odds: number
  q_score: number
  edge: number
  actual_result: 0 | 1 | null
}

export interface H2HMatch {
  home: string
  away: string
  score: string
  date: string
}

export interface MatchInfo {
  found: boolean
  event_id: string | number
  home: string
  away: string
  league: string
  kickoff_utc: string
  home_id: string | number | null
  away_id: string | number | null
  btts_pct: number | null
  over15_pct: number | null
  over25_pct: number | null
  avg_goals: number | null
  h2h: number | null
  h2h_matches: H2HMatch[]
  predictions: MatchPrediction[]
}

export interface FormMatch {
  result: "W" | "D" | "L"
  opponent?: string
  score?: string
  date?: string
}

export interface TeamForm {
  team: string
  matches: FormMatch[]
  btts_pct: number | null
  avg_gf: number | null
  avg_ga: number | null
}

export interface StandingRow {
  position: number
  team_id: string | number | null
  team: string
  played: number
  points: number
  gf: number
  ga: number
}

export interface Scorer {
  player: string
  team: string
  goals: number
  assists: number
  appearances?: number
}

export type FormResult = "W" | "D" | "L"

export interface TeamSeason {
  team_id: string | number
  name: string
  league: string
  country: string
  logo: string | null
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  btts_pct: number | null
  over15_pct: number | null
  over25_pct: number | null
  form: FormResult[]
  scorers: Scorer[]
}

export interface UpcomingMatch {
  event_id: string | number
  home: string
  away: string
  league: string
  kickoff_utc: string
  predictions: MatchPrediction[]
}

export interface LeagueFormRow {
  team_id: string | number | null
  team: string
  results: FormResult[]
}
