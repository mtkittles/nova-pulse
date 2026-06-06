// Realne kody lig Oracle (z raportu: active=1, >50 meczów).
// Używane w /ligi (selektor) oraz do mapowania nazwa→kod (forma w /mecz).

export interface League {
  code: string
  name: string
  country: string
}

export const LEAGUES: League[] = [
  { code: "PL", name: "Premier League", country: "Anglia" },
  { code: "ELC", name: "Championship", country: "Anglia" },
  { code: "PD", name: "La Liga", country: "Hiszpania" },
  { code: "SA", name: "Serie A", country: "Włochy" },
  { code: "BL1", name: "Bundesliga", country: "Niemcy" },
  { code: "D2", name: "2. Bundesliga", country: "Niemcy" },
  { code: "PPL", name: "Primeira Liga", country: "Portugalia" },
  { code: "J1", name: "J1 League", country: "Japonia" },
  { code: "JAP_J2", name: "J2 League", country: "Japonia" },
  { code: "ARG", name: "Liga Profesional", country: "Argentyna" },
  { code: "BSA", name: "Serie A", country: "Brazylia" },
  { code: "BRA_SERIE", name: "Serie B", country: "Brazylia" },
  { code: "MLS", name: "Major League Soccer", country: "USA" },
  { code: "MX", name: "Liga MX", country: "Meksyk" },
  { code: "T1", name: "Super Lig", country: "Turcja" },
  { code: "ROU", name: "Liga 1", country: "Rumunia" },
  { code: "F2", name: "Ligue 2", country: "Francja" },
  { code: "I2", name: "Serie B", country: "Włochy" },
  { code: "SP2", name: "Segunda Division", country: "Hiszpania" },
  { code: "SWE", name: "Allsvenskan", country: "Szwecja" },
  { code: "SC0", name: "Premiership", country: "Szkocja" },
  { code: "AUT", name: "Bundesliga", country: "Austria" },
  { code: "NET_EERSTE", name: "Eerste Divisie", country: "Holandia" },
  { code: "COL_PRIMER", name: "Primera A", country: "Kolumbia" },
  { code: "ALG_LIGUE", name: "Ligue 1", country: "Algieria" },
  { code: "SP3A", name: "Primera División RFEF - Group 3", country: "Hiszpania" },
  { code: "SP3B", name: "Primera Fed. RFEF - Group 2", country: "Hiszpania" },
  { code: "IC2", name: "Serie C - Girone B", country: "Włochy" },
  { code: "UECL", name: "UEFA Europa Conference League", country: "Europa" },
]

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

// nazwa→kod (pierwsza pasująca), z preferencjami dla nazw wieloznacznych.
const NAME_TO_CODE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const l of LEAGUES) {
    const key = norm(l.name)
    if (!(key in map)) map[key] = l.code
  }
  // preferencje dla nazw powtarzających się między krajami
  Object.assign(map, {
    "serie a": "SA", // Włochy
    bundesliga: "BL1", // Niemcy
    championship: "ELC", // Anglia
    "serie b": "I2", // Włochy
    "ligue 1": "ALG_LIGUE", // jedyna „Ligue 1" w zbiorze
  })
  return map
})()

export function leagueCodeByName(name: string): string | null {
  if (!name) return null
  return NAME_TO_CODE[norm(name)] ?? null
}
