// Typy danych dla web-panelu Lupus Bot.
// Źródło docelowe: tabela `bot_predictions` na Oracle (przez Cloudflare Tunnel).
// Patrz kontrakt API w PLAN.md.

export type DataSourceStatus = "live" | "mock" | "error"

export interface DataSourceMeta {
  source: DataSourceStatus
  source_message?: string
}

export type BetType = "BTTS" | "OVER_1_5" | "MIX" | "THRILLER"
export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "UNKNOWN"
export type SettlementStatus = "pending" | "won" | "lost" | "void" | "push" | "unknown"

export interface Tip {
  event_id: string | number
  league: string
  home: string
  away: string
  /** ISO 8601, czas UTC rozpoczęcia meczu */
  kickoff_utc: string
  bet_type: BetType
  /** np. "YES" / "NO" / "OVER" — strona tylko wyświetla */
  bet_side: string
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
  match_status?: MatchStatus
  match_minute?: number | null
  match_score?: string | null
  settlement_status?: SettlementStatus
}

export interface TipsResponse extends DataSourceMeta {
  /** data dnia w formacie YYYY-MM-DD */
  date: string
  tips: Tip[]
}
