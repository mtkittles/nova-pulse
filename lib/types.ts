// Typy danych dla web-panelu Lupus Bot.
// Źródło docelowe: tabela `bot_predictions` na Oracle (przez Cloudflare Tunnel).
// Patrz kontrakt API w PLAN.md.

export type BetType = "BTTS" | "OVER_1_5" | "MIX" | "THRILLER"

/** Tier rekomendacji z Oracle: value (najmocniejszy) / watchlist / analysis. */
export type RecommendationTier = "value" | "watchlist" | "analysis"

export interface Tip {
  event_id: string | number
  league: string
  /** surowy kod ligi z Oracle (do filtrowania); `league` to nazwa czytelna */
  leagueCode?: string
  home: string
  away: string
  /** URL herbów z Oracle (media.api-sports.io); null → fallback inicjały */
  homeLogo?: string | null
  awayLogo?: string | null
  /** ISO 8601, czas UTC rozpoczęcia meczu; null gdy mecz nie ma jeszcze fixture */
  kickoff_utc: string | null
  bet_type: BetType
  /** surowy bet_type z Oracle ("1","x","o25","o15"...) — do etykiet rynków */
  bet_type_raw?: string
  /** np. "YES" / "NO" / "OVER" — strona tylko wyświetla */
  bet_side: string
  /** surowy bet_side z Oracle ("home"/"away"/"") — do rozróżnienia rynku */
  bet_side_raw?: string
  /** prawdopodobieństwo modelu, zakres 0..1; null gdy Oracle nie podał (NIE 0) */
  model_prob: number | null
  /** kurs bukmacherski; null gdy brak (NIE 0) */
  odds: number | null
  /** edge / wartość oczekiwana, np. 0.08 = +8%; null gdy nie da się policzyć */
  edge: number | null
  /** Q-Score jakości typu, zakres 0..100; null gdy brak oceny (NIE 0) */
  q_score: number | null
  /** NULL przed meczem, 1 = trafione, 0 = pudło (weryfikuje live_tracker) */
  actual_result: 0 | 1 | null
  /** główna rekomendacja meczu (z Oracle) — zamiast lokalnego max(q_score) */
  is_primary?: boolean
  /** tier rekomendacji z Oracle; null gdy brak */
  tier?: RecommendationTier | null
  /** wynik meczu z Oracle (gdy rozegrany) */
  home_score?: number | null
  away_score?: number | null
  /** "FINISHED" | "LIVE" | "SCHEDULED" z Oracle */
  match_status?: string
}

export interface TipsResponse {
  /** data dnia w formacie YYYY-MM-DD */
  date: string
  tips: Tip[]
}
