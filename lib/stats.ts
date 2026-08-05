import type { StatsResponse } from "./stats-types"
import { mockStats } from "./mock-stats"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptStats } from "./oracle-map"
import { isDemoDataOn } from "./demo-source"
import { demoStatsPayload, demoCalibration, demoBreakdown, type CalibrationPoint, type BreakdownData } from "./demo-tips"

function emptyStats(): StatsResponse {
  return {
    generated_at: new Date().toISOString(),
    range_days: 30,
    summary: {
      total_tips: 0,
      settled_tips: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      roi: 0,
      current_streak: 0,
      avg_q_score: 0,
    },
    timeline: [],
    by_market: [],
    by_league: [],
    q_score_buckets: [],
  }
}

function hasSummary(x: unknown): boolean {
  return !!x && typeof x === "object" && !!(x as { summary?: unknown }).summary
}

// period: "7" | "30" | "all"
export async function getStats(period?: string): Promise<StatsResponse> {
  // Tryb demo — pula historyczna (lib/demo-tips.ts), ten sam adapter co produkcja.
  if (await isDemoDataOn()) return adaptStats(demoStatsPayload(period))
  if (!isOracleConfigured()) return mockStats
  const path = period ? `/stats?period=${encodeURIComponent(period)}` : "/stats"
  try {
    const data = await oracleFetch<unknown>(path)
    if (!hasSummary(data)) {
      console.error("getStats: odpowiedź Oracle niezgodna z kontraktem")
      return emptyStats()
    }
    return adaptStats(data)
  } catch (err) {
    console.error("getStats: Oracle niedostępne →", err)
    return emptyStats()
  }
}

export interface DemoAnalytics {
  calibration: CalibrationPoint[]
  breakdown: BreakdownData
}

// Wykres kalibracji + tabela rozbicia (stats/calibration-chart.tsx,
// stats/breakdown-table.tsx) — funkcjonalność wyłącznie trybu demo: nie ma
// odpowiadającego kontraktu/endpointu po stronie Oracle, więc poza demo
// zwraca null i sekcje po prostu się nie renderują (bez pustego stanu-śmiecia).
export async function getDemoAnalytics(): Promise<DemoAnalytics | null> {
  if (!(await isDemoDataOn())) return null
  return { calibration: demoCalibration(), breakdown: demoBreakdown() }
}
