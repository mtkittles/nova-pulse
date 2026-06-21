import type { UserPick } from "./extra-types"

// === Dane mockowe dla trybu demo ===
// Profil testera w trybie demo — żeby sekcje [C] statystyki i [D] ostatnie typy
// miały realistyczną treść zamiast EmptyState. Zero kontaktu z Oracle.

// Daty względem "dziś" (malejąco), żeby 3 ostatnie rozliczone były WON → odznaka 🔥 Seria 3.
const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)

const DEMO_PICKS: UserPick[] = [
  { id: "demo_1", event_id: "demo_e1", date: day(-12), home: "Arsenal", away: "Chelsea", league: "Premier League", bet_type: "OVER_1_5", bet_side: "O1.5", odds: 1.34, stake: 20, status: "won" },
  { id: "demo_2", event_id: "demo_e2", date: day(-10), home: "Lyon", away: "Nice", league: "Ligue 1", bet_type: "MIX", bet_side: "BTTS+O1.5", odds: 1.95, stake: 20, status: "lost" },
  { id: "demo_3", event_id: "demo_e3", date: day(-8), home: "Inter", away: "Milan", league: "Serie A", bet_type: "BTTS", bet_side: "TAK", odds: 1.78, stake: 20, status: "won" },
  { id: "demo_4", event_id: "demo_e4", date: day(-6), home: "Bayern", away: "Dortmund", league: "Bundesliga", bet_type: "THRILLER", bet_side: "TAK", odds: 2.10, stake: 20, status: "won" },
  { id: "demo_5", event_id: "demo_e5", date: day(-4), home: "Kashima Antlers", away: "FC Tokyo", league: "J1 League", bet_type: "OVER_1_5", bet_side: "O1.5", odds: 1.30, stake: 20, status: "won" },
  { id: "demo_6", event_id: "demo_e6", date: day(-2), home: "Real Madryt", away: "Sevilla", league: "La Liga", bet_type: "BTTS", bet_side: "TAK", odds: 1.85, stake: 20, status: "won" },
  { id: "demo_7", event_id: "demo_e7", date: day(2), home: "Cerezo Osaka", away: "Urawa Reds", league: "J1 League", bet_type: "OVER_1_5", bet_side: "O1.5", odds: 1.40, stake: 20, status: "pending" },
]

export const MOCK_PROFILE = {
  uid: "demo_user",
  nick: "Demo Tester",
  avatar: "🐺",
  tier: "premium" as const,
  badges: ["🎯 Pierwszy typ", "🔥 Seria 3", "💎 Weteran"],
  picks: DEMO_PICKS,
}
