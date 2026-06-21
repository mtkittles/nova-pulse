// Kontrakt statystyk skuteczności — GOTOWE AGREGATY liczone po stronie bota
// (z tabeli `bot_predictions`, pole `actual_result`). Strona tylko rysuje.
// Docelowo: GET /public-api/stats (patrz lib/stats.ts).

export interface StatsSummary {
  total_tips: number
  settled_tips: number
  wins: number
  losses: number
  /** 0..1 */
  win_rate: number
  /** zwrot z inwestycji, np. 0.11 = +11% (płaska stawka 1u) */
  roi: number
  /** seria: dodatnia = wygrane z rzędu, ujemna = przegrane */
  current_streak: number
  /** średni Q-Score, 0..100 */
  avg_q_score: number
}

export interface TimelinePoint {
  /** YYYY-MM-DD */
  date: string
  /** skumulowany win-rate do tego dnia, 0..1 */
  win_rate: number
  /** skumulowany ROI do tego dnia, np. 0.11 */
  roi: number
  /** liczba typów tego dnia */
  tips: number
}

export interface MarketStat {
  /** etykieta rynku 1:1 z Oracle ("Team O1.5", "BTTS", "Over", "1X2", "Handicap") */
  label: string
  tips: number
  /** 0..1 */
  win_rate: number
  /** 0..1 (ułamek): 0.4263 = +42.63% */
  roi: number
}

export interface LeagueStat {
  league: string
  tips: number
  /** 0..1 */
  win_rate: number
  /** 0..1 (ułamek): 0.4263 = +42.63% */
  roi: number
}

export interface QScoreBucket {
  /** np. "70–80" */
  bucket: string
  tips: number
  /** 0..1 — pokazuje kalibrację: wyższy Q-Score → wyższa trafialność */
  win_rate: number
  /** 0..1 (ułamek): 0.4263 = +42.63% */
  roi: number
}

export interface StatsResponse {
  /** ISO — kiedy bot policzył agregaty */
  generated_at: string
  /** okno analizy w dniach */
  range_days: number
  summary: StatsSummary
  timeline: TimelinePoint[]
  by_market: MarketStat[]
  by_league: LeagueStat[]
  q_score_buckets: QScoreBucket[]
}
