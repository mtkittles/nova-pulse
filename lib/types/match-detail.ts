// Kontrakt strony /mecz/[id] — re-eksport typów szczegółów meczu.
// Źródło prawdy: lib/extra-types.ts (adaptowane z Oracle /match/{id}/detailed).
export type {
  MatchDetailed,
  MatchPrediction,
  MatchStatus,
  OddsMarkets,
  TeamMetrics,
  H2HMatch,
  H2HSummary,
  ScoreDist,
} from "@/lib/extra-types"
