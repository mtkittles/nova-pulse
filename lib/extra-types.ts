import type { BetType, RecommendationTier } from "./types"

export type FormScope = "all" | "home" | "away"

export interface CalendarDay {
  date: string // YYYY-MM-DD
  tips: number // -1 = są typy, liczba nieznana
  matches: number
  leagues: number
  analyzed?: number // ile meczów ma już predykcję
  below_threshold?: number // ile miało predykcję, ale Q < 50
  no_data?: number // matches - analyzed
  has_worldcup?: boolean // czy jest mecz MŚ tego dnia
}

export interface MatchPrediction {
  bet_type: BetType
  /** surowy bet_type/bet_side z Oracle — do etykiet rynków */
  bet_type_raw?: string
  bet_side_raw?: string
  bet_side: string
  /** 0..1; null gdy Oracle nie podał wartości (NIE traktować jak 0) */
  model_prob: number | null
  odds: number | null
  q_score: number | null
  edge: number | null
  actual_result: 0 | 1 | null
  /** wynik końcowy meczu z Oracle (gdy rozegrany); null gdy brak */
  actual_home_score?: number | null
  actual_away_score?: number | null
  /** główna rekomendacja meczu (z Oracle) — zamiast lokalnego max(q_score) */
  is_primary?: boolean
  /** tier rekomendacji z Oracle; null gdy brak */
  tier?: RecommendationTier | null
  /** rozbicie Q-Score (gdy Oracle podał); null → sekcja ukryta */
  q_score_breakdown?: QScoreBreakdown | null
}

export interface QScoreFactor {
  label: string
  delta: number // dodatni = plus, ujemny = minus
}

export interface QScoreBreakdown {
  total: number
  base: number // zwykle 50
  factors: QScoreFactor[]
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
  leagueCode?: string
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
  gf?: number // gole TEJ drużyny
  ga?: number // gole przeciwnika
  home?: boolean
  // rynki rozliczone w tym meczu (z Oracle lub policzone z gf/ga); null = nieznane
  btts?: boolean | null
  over15?: boolean | null
  over25?: boolean | null
  teamOver15?: boolean | null // ta drużyna strzeliła ≥2
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
  logo?: string | null
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

export interface SideStats {
  played?: number
  gf_avg?: number | null
  ga_avg?: number | null
  btts_pct?: number | null
  over15_pct?: number | null
  over25_pct?: number | null
  clean_sheets_pct?: number | null
}

export interface TeamSeason {
  team_id: string | number
  name: string
  league: string
  country: string
  logo: string | null
  position?: number
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  btts_pct: number | null
  over15_pct: number | null
  over25_pct: number | null
  home_stats?: SideStats | null
  away_stats?: SideStats | null
  form: FormResult[]
  scorers: Scorer[]
}

export interface UpcomingMatch {
  event_id: string | number
  home: string
  away: string
  opponent: string // dla /team/{id}/upcoming (przeciwnik względem drużyny)
  league: string
  leagueCode?: string
  kickoff_utc: string
  predictions: MatchPrediction[]
}

export interface LeagueFormRow {
  team_id: string | number | null
  team: string
  results: FormResult[]
  gf?: number
  ga?: number
  btts_pct?: number | null
  over15_pct?: number | null
}

// — kupony użytkownika (/user/{telegram_id}/picks) —
export interface UserPick {
  id: string | number
  event_id: string | number
  date: string
  home: string
  away: string
  league: string
  bet_type: BetType
  bet_side: string
  odds: number
  stake: number
  status: "pending" | "won" | "lost"
}

// === Rankingi rynkowe drużyn (/rankings/markets) ===
export interface RankingNextMatch {
  event_id: string | number | null
  opponent: string
  date: string
  home_away: string // "home" | "away" | ""
  predicted_prob: number | null // predicted_btts_prob / predicted_over_15_prob (0..1 lub %)
  q_score: number | null
}

export interface RankingTeam {
  team_id: string | number
  team_name: string
  logo?: string | null
  league: string
  league_code: string
  pct_last10: number // btts_pct_last10 / over_15_pct_last10
  next_match: RankingNextMatch | null
}

export interface MarketRankings {
  btts: RankingTeam[]
  over_15: RankingTeam[]
}

// === Ranking typerów (/rankings/users) ===
export interface RankingUser {
  display_id: string // zamaskowany identyfikator, np. "123***45"
  total_picks: number
  won_picks: number
  win_rate: number // 0..100
  roi: number | null // ułamek (0.42 = +42%); null gdy brak
  avg_odds: number | null // średni kurs, np. 1.85; null gdy brak
  current_streak: number | null // seria wygranych; null gdy brak
}

export interface UserRankings {
  users: RankingUser[]
  updated_at: string | null
  error: boolean
}

// === Mistrzostwa Świata 2026 (/worldcup/*) ===
export type WCStatus = "advance" | "playoff" | "out"

export interface WCStanding {
  position: number
  team: string
  team_id?: string | number | null
  logo?: string | null
  played: number
  win: number
  draw: number
  loss: number
  gf: number
  ga: number
  gd: number
  points: number
  advance_pct?: number | null
  champion_pct?: number | null
  status?: WCStatus
}

export interface WCGroup {
  name: string // "A".."L"
  teams: WCStanding[]
}

export type WCStage = "group" | "R32" | "R16" | "QF" | "SF" | "3RD" | "FINAL"

export interface WCMatch {
  event_id: string | number
  home: string
  away: string
  home_id?: string | number | null
  away_id?: string | number | null
  group?: string | null
  stage: WCStage
  stadium?: string | null
  city?: string | null
  kickoff_utc: string
  status: MatchStatus
  home_score?: number | null
  away_score?: number | null
  predicted_home?: number | null
  predicted_away?: number | null
  prob_home?: number | null
  prob_draw?: number | null
  prob_away?: number | null
  btts_pct?: number | null
  over25_pct?: number | null
  q_score?: number | null
}

export interface WCTie {
  stage: WCStage
  slot?: string
  event_id?: string | number | null
  home?: string | null
  away?: string | null
  /** etykieta-placeholder gdy drużyna nieznana, np. "1A", "3C/D/E/F" */
  home_label?: string | null
  away_label?: string | null
  home_id?: string | number | null
  away_id?: string | number | null
  home_score?: number | null
  away_score?: number | null
  winner?: "home" | "away" | null
  prob_home?: number | null
  kickoff_utc?: string | null
}

export interface WCInfo {
  phase: string // np. "Faza grupowa"
  start_utc: string
  next_match?: WCMatch | null
}

// Faza turnieju ze stanu Oracle (state machine /mundial).
export type WCPhase = "pre" | "group" | "knockout" | "finished"

export interface WCOverviewGroup {
  name: string
  matches_played: number
}

export interface WCOverview {
  phase: WCPhase
  total_matches: number
  group_matches: number
  knockout_matches: number
  groups: WCOverviewGroup[]
  /** mistrz (faza "finished") jeśli znany */
  champion?: string | null
  start_utc: string
  next_match?: WCMatch | null
}

// — szczegółowy mecz (/match/{id}/detailed) —
export interface TeamMetrics {
  name: string
  gf_avg: number
  ga_avg: number
  btts_pct: number
  over15_pct: number
  clean_sheets_pct: number
  form_points: number // 0..100
}

export interface H2HSummary {
  home_wins: number
  away_wins: number
  draws: number
  btts_pct: number | null
  avg_goals: number | null
}

export interface ScoreDist {
  score: string // np. "2:1"
  count: number
}

// Kursy rynków do siatki na /mecz/{id}. null = brak rynku (front pokaże „—").
export interface OddsMarkets {
  btts_yes: number | null
  btts_no: number | null
  home_win: number | null
  draw: number | null
  away_win: number | null
  over25: number | null
  over35: number | null
  cs_32: number | null
  cs_23: number | null
  /** Team Over 1.5 — kolumny mogą nie istnieć w DB → zwykle null (przygotowanie na przyszłość) */
  home_team_o15: number | null
  away_team_o15: number | null
}

export type MatchStatus =
  | "upcoming"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled"
  | "unknown"

export interface MatchDetailed {
  found: boolean
  event_id: string | number
  home: string
  away: string
  homeLogo?: string | null
  awayLogo?: string | null
  league: string
  leagueCode?: string
  kickoff_utc: string
  stadium: string | null
  status: MatchStatus
  /** wynik końcowy meczu z Oracle (gdy rozegrany); null gdy brak */
  home_score: number | null
  away_score: number | null
  home_id: string | number | null
  away_id: string | number | null
  predictions: MatchPrediction[]
  odds_markets: OddsMarkets | null
  home_metrics: TeamMetrics | null
  away_metrics: TeamMetrics | null
  h2h_matches: H2HMatch[]
  h2h_summary: H2HSummary | null
  score_distribution: ScoreDist[]
  /** Macierz P(home=i, away=j) z modelu Dixon-Coles; i,j = 0..N (zwykle 0..5). 0..1. */
  score_matrix: number[][] | null
  home_scorers: Scorer[]
  away_scorers: Scorer[]
}
