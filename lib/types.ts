// Typy danych dla web-panelu Lupus Bot.
// Źródło docelowe: tabela `bot_predictions` na Oracle (przez Cloudflare Tunnel).
// Patrz kontrakt API w PLAN.md.

export type BetType = "BTTS" | "OVER_1_5" | "MIX" | "THRILLER"

export interface Tip {
  event_id: string | number
  league: string
  /** surowy kod ligi z Oracle (do filtrowania); `league` to nazwa czytelna */
  leagueCode?: string
  home: string
  away: string
  /** ISO 8601, czas UTC rozpoczęcia meczu; null gdy mecz nie ma jeszcze fixture */
  kickoff_utc: string | null
  bet_type: BetType
  /** surowy bet_type z Oracle ("1","x","o25","o15"...) — do etykiet rynków */
  bet_type_raw?: string
  /** np. "YES" / "NO" / "OVER" — strona tylko wyświetla */
  bet_side: string
  /** surowy bet_side z Oracle ("home"/"away"/"") — do rozróżnienia rynku */
  bet_side_raw?: string
  /** prawdopodobieństwo modelu, zakres 0..1 */
  model_prob: number
  /** kurs bukmacherski */
  odds: number
  /** edge / wartość oczekiwana, np. 0.08 = +8% */
  edge: number
  /** Q-Score jakości typu, zakres 0..100 */
  q_score: number
  /** NULL przed meczem, 1 = trafione, 0 = pudło (weryfikuje live_tracker) */
  actual_result: 0 | 1 | null
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
