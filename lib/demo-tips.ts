// === GENERATOR TYPÓW DEMO — tryb preview ===
//
// Zwraca DOKŁADNIE ten sam kształt co Oracle po migracji:
//   { date, count, matches: [{ ...match_info, predictions: [...] }] }
// dzięki czemu dane demo przechodzą przez ten sam adapter (`adaptTips`) co
// produkcja — demo TESTUJE adapter, a nie go omija.
//
// Determinizm: PRNG seedowany datą. Ta sama data → zawsze te same mecze
// (stabilny SSR, brak hydration mismatch, powtarzalne screeny).
//
// Zero wpływu na produkcyjny fetch z Oracle — moduł wpinany wyłącznie przez
// early-return w `lib/tips.ts` / `lib/calendar.ts`.
//
// Uwaga: `lib/demo-data.ts` to co innego (profil/kupony testera).

import { primeLeagueNames } from "./leagues"
import { resolveTip } from "./tip-utils"

// ——— PRNG (mulberry32) — deterministyczny, seedowany stringiem ———

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rnd = () => number

function pick<T>(rnd: Rnd, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length]
}

function weighted<T>(rnd: Rnd, rows: readonly (readonly [T, number])[]): T {
  const total = rows.reduce((s, r) => s + r[1], 0)
  let x = rnd() * total
  for (const [v, w] of rows) {
    x -= w
    if (x <= 0) return v
  }
  return rows[rows.length - 1][0]
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function round2(x: number): number {
  return Math.round(x * 100) / 100
}

// ——— Ligi + drużyny ———
// team_id → herb `https://media.api-sports.io/football/teams/{id}.png`.
// ID odwzorowują API-Football best-effort; przy nietrafionym ID obrazek zwróci
// 404, a TeamBadge pokaże inicjały (ten sam fallback co w produkcji).

interface DemoLeague {
  code: string
  name: string
  country: string
  flag: string
  teams: readonly (readonly [string, number])[]
}

const LEAGUES: readonly DemoLeague[] = [
  {
    code: "PL", name: "Premier League", country: "Anglia", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teams: [
      ["Arsenal", 42], ["Chelsea", 49], ["Liverpool", 40], ["Manchester City", 50],
      ["Manchester United", 33], ["Tottenham", 47], ["Newcastle", 34], ["Aston Villa", 66],
      ["Brighton", 51], ["West Ham", 48], ["Everton", 45], ["Crystal Palace", 52],
      ["Brentford", 55], ["Fulham", 36], ["Nottingham Forest", 65], ["Wolves", 39],
    ],
  },
  {
    code: "ELC", name: "Championship", country: "Anglia", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teams: [
      ["Leeds United", 63], ["Leicester City", 46], ["Southampton", 41], ["Norwich City", 71],
      ["West Bromwich Albion", 60], ["Middlesbrough", 70], ["Watford", 38],
      ["Sheffield United", 62], ["Stoke City", 75], ["Hull City", 64],
    ],
  },
  {
    code: "PD", name: "La Liga", country: "Hiszpania", flag: "🇪🇸",
    teams: [
      ["Real Madrid", 541], ["Barcelona", 529], ["Atlético Madrid", 530], ["Sevilla", 536],
      ["Real Sociedad", 548], ["Villarreal", 533], ["Real Betis", 543], ["Athletic Club", 531],
      ["Valencia", 532], ["Celta Vigo", 538], ["Getafe", 546],
    ],
  },
  {
    code: "BL1", name: "Bundesliga", country: "Niemcy", flag: "🇩🇪",
    teams: [
      ["Bayern München", 157], ["Borussia Dortmund", 165], ["Bayer Leverkusen", 168],
      ["RB Leipzig", 173], ["Eintracht Frankfurt", 169], ["VfB Stuttgart", 172],
      ["Union Berlin", 182], ["SC Freiburg", 160], ["Borussia M'gladbach", 163],
      ["Hoffenheim", 167], ["Werder Bremen", 162], ["VfL Wolfsburg", 161],
    ],
  },
  {
    code: "SA", name: "Serie A", country: "Włochy", flag: "🇮🇹",
    teams: [
      ["Inter", 505], ["AC Milan", 489], ["Juventus", 496], ["Napoli", 492],
      ["AS Roma", 497], ["Lazio", 487], ["Atalanta", 499], ["Fiorentina", 502],
      ["Bologna", 500], ["Torino", 503],
    ],
  },
  {
    code: "FL1", name: "Ligue 1", country: "Francja", flag: "🇫🇷",
    teams: [
      ["Paris Saint-Germain", 85], ["Olympique Marseille", 81], ["Olympique Lyonnais", 80],
      ["AS Monaco", 91], ["Lille", 79], ["OGC Nice", 84], ["Stade Rennais", 94], ["RC Lens", 116],
    ],
  },
  {
    code: "DED", name: "Eredivisie", country: "Holandia", flag: "🇳🇱",
    teams: [
      ["Ajax", 194], ["PSV Eindhoven", 197], ["Feyenoord", 209], ["AZ Alkmaar", 201],
      ["FC Twente", 415], ["FC Utrecht", 200],
    ],
  },
  {
    code: "POL", name: "Ekstraklasa", country: "Polska", flag: "🇵🇱",
    teams: [
      ["Legia Warszawa", 341], ["Lech Poznań", 342], ["Pogoń Szczecin", 349],
      ["Jagiellonia Białystok", 344], ["Górnik Zabrze", 339], ["Cracovia", 337],
      ["Piast Gliwice", 348], ["Śląsk Wrocław", 350], ["Lechia Gdańsk", 343],
      ["Korona Kielce", 340], ["Zagłębie Lubin", 354], ["Widzew Łódź", 352],
    ],
  },
  {
    code: "PPL", name: "Primeira Liga", country: "Portugalia", flag: "🇵🇹",
    teams: [
      ["Benfica", 211], ["FC Porto", 212], ["Sporting CP", 228], ["SC Braga", 217],
      ["Vitória Guimarães", 222],
    ],
  },
  {
    code: "BSA", name: "Brasileirão Série A", country: "Brazylia", flag: "🇧🇷",
    teams: [
      ["Flamengo", 127], ["Palmeiras", 121], ["Corinthians", 131], ["São Paulo", 126],
      ["Fluminense", 124], ["Grêmio", 130], ["Internacional", 119], ["Botafogo", 120],
      ["Santos", 128], ["Cruzeiro", 135], ["Vasco da Gama", 133],
    ],
  },
  {
    code: "ARG", name: "Liga Profesional", country: "Argentyna", flag: "🇦🇷",
    teams: [
      ["Boca Juniors", 451], ["River Plate", 435], ["Racing Club", 436], ["Independiente", 452],
      ["San Lorenzo", 460], ["Estudiantes", 450], ["Vélez Sarsfield", 438], ["Talleres", 445],
    ],
  },
  {
    code: "SWE", name: "Allsvenskan", country: "Szwecja", flag: "🇸🇪",
    teams: [
      ["Malmö FF", 377], ["AIK", 376], ["Djurgården", 375], ["Hammarby", 379],
      ["IFK Göteborg", 381], ["IF Elfsborg", 382],
    ],
  },
  {
    code: "NOR", name: "Eliteserien", country: "Norwegia", flag: "🇳🇴",
    teams: [
      ["Bodø/Glimt", 327], ["Molde", 331], ["Rosenborg", 335], ["SK Brann", 324],
      ["Viking", 336], ["Lillestrøm", 330],
    ],
  },
  {
    code: "DEN", name: "Superliga", country: "Dania", flag: "🇩🇰",
    teams: [
      ["FC København", 400], ["FC Midtjylland", 397], ["Brøndby IF", 407],
      ["AGF Aarhus", 401], ["Randers FC", 406],
    ],
  },
  {
    code: "SC0", name: "Premiership", country: "Szkocja", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    teams: [
      ["Celtic", 247], ["Rangers", 257], ["Heart of Midlothian", 251], ["Aberdeen", 252],
      ["Hibernian", 254],
    ],
  },
  {
    code: "T1", name: "Süper Lig", country: "Turcja", flag: "🇹🇷",
    teams: [
      ["Galatasaray", 645], ["Fenerbahçe", 611], ["Beşiktaş", 549], ["Trabzonspor", 998],
    ],
  },
]

// Nazwy/kraje/flagi lig spoza statycznego słownika LEAGUES (lib/leagues.ts)
// wstrzykujemy do cache'u nazw — bez modyfikowania produkcyjnego słownika.
let namesPrimed = false
function primeDemoLeagueNames(): void {
  if (namesPrimed) return
  const dict: Record<string, { name: string; country: string; flag: string }> = {}
  for (const l of LEAGUES) dict[l.code] = { name: l.name, country: l.country, flag: l.flag }
  primeLeagueNames(dict)
  namesPrimed = true
}

function logo(teamId: number): string {
  return `https://media.api-sports.io/football/teams/${teamId}.png`
}

// ——— Katalog rynków ———
// `settleable` = rozliczany przez resolveTip (ta sama funkcja, której używa UI).
// Rynki nierozliczalne trafiają WYŁĄCZNIE na mecze bez wyniku, żeby demo nigdy
// nie pokazało `result` niezgodnego z tym, co UI wylicza ze skoru.

interface MarketSpec {
  market: string
  pick: string
  bet_type: string
  bet_side: string
  settleable: boolean
}

const MARKETS: readonly MarketSpec[] = [
  { market: "Both Teams To Score", pick: "Yes", bet_type: "BTTS", bet_side: "yes", settleable: true },
  { market: "Goals Over/Under", pick: "Over 1.5", bet_type: "o15", bet_side: "", settleable: true },
  { market: "Goals Over/Under", pick: "Over 2.5", bet_type: "o25", bet_side: "", settleable: true },
  { market: "Goals Over/Under", pick: "Over 3.5", bet_type: "o35", bet_side: "", settleable: true },
  { market: "Team Total Goals", pick: "Home Over 1.5", bet_type: "o15", bet_side: "home", settleable: true },
  { market: "Team Total Goals", pick: "Away Over 1.5", bet_type: "o15", bet_side: "away", settleable: true },
  { market: "Match Winner", pick: "Home", bet_type: "1", bet_side: "home", settleable: true },
  { market: "Match Winner", pick: "Away", bet_type: "2", bet_side: "away", settleable: true },
  { market: "Match Winner", pick: "Draw", bet_type: "x", bet_side: "draw", settleable: true },
  // Handicap: resolveTip go nie rozlicza → tylko mecze bez wyniku (filtr HANDICAP na /typy).
  { market: "Asian Handicap", pick: "Home -1.5", bet_type: "hcap", bet_side: "home", settleable: false },
  { market: "Asian Handicap", pick: "Away -1.5", bet_type: "hcap", bet_side: "away", settleable: false },
]

// Realistyczny rozkład wyników piłkarskich.
const SCORELINES: readonly (readonly [readonly [number, number], number])[] = [
  [[1, 0], 11], [[2, 1], 10], [[1, 1], 10], [[2, 0], 9], [[0, 0], 7], [[0, 1], 7],
  [[1, 2], 6], [[3, 1], 6], [[2, 2], 5], [[3, 0], 4], [[0, 2], 4], [[3, 2], 3],
  [[1, 3], 2], [[4, 0], 2], [[4, 1], 2], [[2, 3], 2], [[0, 3], 2], [[4, 2], 1],
  [[3, 3], 1], [[5, 1], 1],
]

// Liczba rynków w meczu. >3 → karta pokazuje 3 + „+N więcej".
const MARKET_COUNT: readonly (readonly [number, number])[] = [
  [1, 34], [2, 25], [3, 18], [4, 12], [5, 7], [6, 4],
]

// ——— Kształt odpowiedzi (1:1 z Oracle po migracji) ———

export interface DemoPrediction {
  market: string
  pick: string
  bet_type: string
  bet_side: string
  odds: number
  q_score: number
  confidence: number
  result: 0 | 1 | "VOID" | null
  is_primary_recommendation: boolean
  recommendation_tier: "value" | "watchlist" | "analysis"
}

export interface DemoMatch {
  event_id: number
  home_team: string
  away_team: string
  league: string
  kickoff_utc: string | null
  match_status: string | null
  home_score: number | null
  away_score: number | null
  home_team_logo: string | null
  away_team_logo: string | null
  predictions: DemoPrediction[]
}

export interface DemoTipsPayload {
  date: string
  count: number
  matches: DemoMatch[]
}

// ——— Budowa pojedynczej predykcji ———

function buildPrediction(
  rnd: Rnd,
  spec: MarketSpec,
  homeScore: number | null,
  awayScore: number | null,
  settled: boolean,
  voided: boolean,
): DemoPrediction {
  // Kurs 1.5–4.5, rozkład skośny w stronę niskich — tak wygląda realny portfel
  // value-bettingu (i podnosi 1/odds, więc confidence pokrywa całe 0.3–0.8).
  const odds = round2(1.5 + 3.0 * Math.pow(rnd(), 1.7))

  // Confidence WYPROWADZAMY z kursu i docelowego edge — inaczej edge byłby
  // przypadkowy, a filtr „Tylko value" (edge > 0, domyślnie ON na /typy)
  // wyciąłby większość demo. Rozkład skośny dodatnio → ~70% typów z edge > 0.
  const targetEdge = -0.06 + rnd() * 0.2 // -0.06 … +0.14
  const confidence = clamp(1 / odds + targetEdge, 0.3, 0.8)
  const realEdge = confidence - 1 / odds

  // Q-Score: baza równomierna 55–100 + lekka korelacja z edge (bez zbijania rozkładu).
  const q_score = Math.round(clamp(55 + rnd() * 45 + realEdge * 60, 55, 100))

  const recommendation_tier: DemoPrediction["recommendation_tier"] =
    realEdge > 0.06 && q_score >= 75 ? "value" : realEdge > 0 ? "watchlist" : "analysis"

  // Wynik liczony TĄ SAMĄ funkcją, której używa UI (settleTip → resolveTip),
  // więc odznaka na karcie zawsze zgadza się z polem `result`.
  let result: DemoPrediction["result"] = null
  if (voided) {
    result = "VOID"
  } else if (settled && homeScore != null && awayScore != null) {
    const s = resolveTip(spec.bet_type, spec.bet_side, homeScore, awayScore)
    result = s === "won" ? 1 : s === "lost" ? 0 : null
  }

  return {
    market: spec.market,
    pick: spec.pick,
    bet_type: spec.bet_type,
    bet_side: spec.bet_side,
    odds,
    q_score,
    confidence: round2(confidence),
    result,
    is_primary_recommendation: false, // ustawiane po zbudowaniu grupy
    recommendation_tier,
  }
}

/** Losuje `count` różnych rynków. Dla meczów rozliczanych — tylko `settleable`. */
function chooseMarkets(rnd: Rnd, count: number, settled: boolean): MarketSpec[] {
  const pool = MARKETS.filter((m) => (settled ? m.settleable : true))
  const shuffled = [...pool]
  // Fisher-Yates (stabilniejszy od sort() z losowym komparatorem)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

const TARGET_WIN_RATE = 0.63 // po odjęciu ~5% voidów daje ≈60/35/5

/**
 * Dobiera wynik meczu do JUŻ wybranych rynków tak, by ok. 60% z nich było
 * trafionych.
 *
 * Kolejność jest odwrotna niż intuicyjna — i to jest sedno. Gdyby najpierw
 * losować wynik, a potem rynki „ważone pod trafienie", docelowy odsetek byłby
 * nieosiągalny: przy 1:0 tylko 1 z 9 rozliczalnych rynków wygrywa, więc każdy
 * mecz niskopunktowy ciągnąłby średnią do ~50%.
 *
 * Realistyczność wyniku zachowuje waga bazowa z SCORELINES; dopasowanie do
 * celu wchodzi jako mnożnik.
 */
function chooseScoreline(rnd: Rnd, specs: readonly MarketSpec[]): readonly [number, number] {
  if (specs.length === 0) return weighted(rnd, SCORELINES)

  const rows = SCORELINES.map(([score, baseWeight]) => {
    const wins = specs.filter(
      (s) => resolveTip(s.bet_type, s.bet_side, score[0], score[1]) === "won",
    ).length
    const fit = 1 - Math.abs(wins / specs.length - TARGET_WIN_RATE)
    return [score, baseWeight * Math.pow(fit, 4)] as const
  })

  return weighted(rnd, rows)
}

function markPrimary(predictions: DemoPrediction[]): void {
  if (predictions.length === 0) return
  let best = 0
  for (let i = 1; i < predictions.length; i++) {
    if (predictions[i].q_score > predictions[best].q_score) best = i
  }
  predictions[best].is_primary_recommendation = true
}

// ——— Budowa meczu ———

function buildMatch(
  rnd: Rnd,
  eventId: number,
  dayIso: string,
  phase: "past" | "today" | "future",
  nowMs: number,
  forceLive = false,
): DemoMatch {
  const league = pick(rnd, LEAGUES)
  const teams = league.teams
  const hi = Math.floor(rnd() * teams.length)
  let ai = Math.floor(rnd() * teams.length)
  if (ai === hi) ai = (ai + 1) % teams.length
  const [homeName, homeId] = teams[hi]
  const [awayName, awayId] = teams[ai]

  // Godzina rozpoczęcia: 12:00 – 21:45 UTC.
  const hour = 12 + Math.floor(rnd() * 10)
  const minute = pick(rnd, [0, 15, 30, 45])
  let kickoff = `${dayIso}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`

  // Bez tego sekcja „Na żywo" na /live bywa pusta — zależnie od pory dnia żaden
  // wylosowany kickoff nie trafia w okno meczu. Demo ma pokazywać stan LIVE
  // niezależnie od godziny, więc kilka meczów „dziś" wsadzamy w okno na sztywno.
  if (forceLive) {
    const forced = new Date(nowMs - (25 + Math.floor(rnd() * 60)) * 60000)
    forced.setUTCSeconds(0, 0)
    const iso = forced.toISOString().replace(/\.\d+Z$/, "Z")
    // tylko jeśli nie przeskoczyliśmy na poprzednią dobę (np. tuż po północy)
    if (iso.slice(0, 10) === dayIso) kickoff = iso
  }

  const kickoffMs = Date.parse(kickoff)

  // ~5% meczów z przeszłości → przełożone (VOID: zwrot stawki, brak wyniku).
  const voided = phase === "past" && rnd() < 0.05

  // Stan meczu ustalamy PRZED wynikiem — decyduje, czy typy w ogóle się rozliczą.
  const match_status = voided
    ? "POSTPONED"
    : phase === "future" || kickoffMs > nowMs
      ? "SCHEDULED"
      : nowMs - kickoffMs < 115 * 60000
        ? "IN_PLAY"
        : "FINISHED"
  const settled = match_status === "FINISHED"

  // Rynki PRZED wynikiem — patrz chooseScoreline.
  const specs = chooseMarkets(rnd, weighted(rnd, MARKET_COUNT), settled)

  let home_score: number | null = null
  let away_score: number | null = null
  if (settled) {
    const [h, a] = chooseScoreline(rnd, specs)
    home_score = h
    away_score = a
  } else if (match_status === "IN_PLAY") {
    // mecz w trakcie — wynik częściowy, typy jeszcze nierozliczone
    const [h, a] = weighted(rnd, SCORELINES)
    home_score = Math.max(0, h - (rnd() < 0.5 ? 1 : 0))
    away_score = Math.max(0, a - (rnd() < 0.5 ? 1 : 0))
  }

  const predictions = specs.map((s) => buildPrediction(rnd, s, home_score, away_score, settled, voided))
  markPrimary(predictions)

  return {
    event_id: eventId,
    home_team: homeName,
    away_team: awayName,
    league: league.code,
    kickoff_utc: kickoff,
    match_status,
    home_score,
    away_score,
    home_team_logo: logo(homeId),
    away_team_logo: logo(awayId),
    predictions,
  }
}

// Sierota — predykcja bez fixture po stronie bota.
// adaptTip wykrywa ją po `kickoff_utc == null && match_status == null`.
// Herby też null → TeamBadge pokazuje inicjały.
function buildOrphan(rnd: Rnd, eventId: number): DemoMatch {
  const league = pick(rnd, LEAGUES)
  const teams = league.teams
  const hi = Math.floor(rnd() * teams.length)
  let ai = Math.floor(rnd() * teams.length)
  if (ai === hi) ai = (ai + 1) % teams.length

  const count = weighted(rnd, [[1, 60], [2, 30], [3, 10]] as const)
  const specs = chooseMarkets(rnd, count, false)
  const predictions = specs.map((s) => buildPrediction(rnd, s, null, null, false, false))
  markPrimary(predictions)

  return {
    event_id: eventId,
    home_team: teams[hi][0],
    away_team: teams[ai][0],
    league: league.code,
    kickoff_utc: null,
    match_status: null,
    home_score: null,
    away_score: null,
    home_team_logo: null,
    away_team_logo: null,
    predictions,
  }
}

// ——— Okno 7 dni ———

const DAY_MS = 864e5
const DAYS_BACK = 3
const DAYS_FWD = 3

function ymdWarsaw(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms))
}

/** Lista 7 dat demo (dziś ±3), rosnąco. */
export function demoDates(nowMs: number = Date.now()): string[] {
  const out: string[] = []
  for (let i = -DAYS_BACK; i <= DAYS_FWD; i++) out.push(ymdWarsaw(nowMs + i * DAY_MS))
  return out
}

function phaseOf(dayIso: string, nowMs: number): "past" | "today" | "future" {
  const today = ymdWarsaw(nowMs)
  if (dayIso < today) return "past"
  if (dayIso > today) return "future"
  return "today"
}

// Sieroty: 2 na dziś + po 1 na dzień sąsiedni = 4 w oknie („kilka" do testu wyszarzenia).
function orphanCount(dayIso: string, nowMs: number): number {
  const ph = phaseOf(dayIso, nowMs)
  if (ph === "today") return 2
  const dates = demoDates(nowMs)
  const idx = dates.indexOf(dayIso)
  const todayIdx = dates.indexOf(ymdWarsaw(nowMs))
  return idx >= 0 && Math.abs(idx - todayIdx) === 1 ? 1 : 0
}

/**
 * Payload dla jednego dnia — kształt identyczny z odpowiedzią Oracle
 * `{ date, count, matches: [...] }`. Poza oknem 7 dni → pusta lista.
 */
export function demoTipsPayload(dateIso: string, nowMs: number = Date.now()): DemoTipsPayload {
  primeDemoLeagueNames()

  if (!demoDates(nowMs).includes(dateIso)) return { date: dateIso, count: 0, matches: [] }

  const rnd = mulberry32(hashSeed(`nova-pulse-demo:${dateIso}`))
  const phase = phaseOf(dateIso, nowMs)

  // 6–8 meczów dziennie → 42–56 w oknie 7 dni (+ 4 sieroty).
  const perDay = 6 + Math.floor(rnd() * 3)
  const dayKey = hashSeed(dateIso) % 100000

  const matches: DemoMatch[] = []
  for (let i = 0; i < perDay; i++) {
    // dwa pierwsze mecze „dziś" wpychamy w okno live, żeby /live nie było puste
    const forceLive = phase === "today" && i < 2
    matches.push(buildMatch(rnd, 900000 + dayKey * 10 + i, dateIso, phase, nowMs, forceLive))
  }
  for (let i = 0; i < orphanCount(dateIso, nowMs); i++) {
    matches.push(buildOrphan(rnd, 990000 + dayKey * 10 + i))
  }

  const count = matches.reduce((s, m) => s + m.predictions.length, 0)
  return { date: dateIso, count, matches }
}

/**
 * Okno „aktywne" dla /live — mecze w przedziale -6h … +24h (to samo, co po
 * stronie Oracle liczy `/tips/active`). Sieroty pomijamy: nie mają kickoffu.
 */
export function demoActivePayload(nowMs: number = Date.now()): DemoTipsPayload {
  const from = nowMs - 6 * 3600e3
  const to = nowMs + 24 * 3600e3
  const matches: DemoMatch[] = []

  for (const d of demoDates(nowMs)) {
    for (const m of demoTipsPayload(d, nowMs).matches) {
      if (!m.kickoff_utc) continue
      const k = Date.parse(m.kickoff_utc)
      if (Number.isFinite(k) && k >= from && k <= to) matches.push(m)
    }
  }

  matches.sort((a, b) => String(a.kickoff_utc).localeCompare(String(b.kickoff_utc)))
  const count = matches.reduce((s, m) => s + m.predictions.length, 0)
  return { date: ymdWarsaw(nowMs), count, matches }
}

/**
 * Historia rozliczonych typów (/stats) — najnowsze najpierw, przycięta do
 * `limit` POJEDYNCZYCH typów (nie meczów).
 */
export function demoHistoryPayload(limit = 15, nowMs: number = Date.now()): DemoTipsPayload {
  const out: DemoMatch[] = []
  let taken = 0

  for (const d of [...demoDates(nowMs)].reverse()) {
    for (const m of demoTipsPayload(d, nowMs).matches) {
      if (taken >= limit) break
      if (m.match_status !== "FINISHED") continue
      const settled = m.predictions.filter((p) => p.result === 0 || p.result === 1)
      if (settled.length === 0) continue
      const preds = settled.slice(0, limit - taken)
      out.push({ ...m, predictions: preds })
      taken += preds.length
    }
    if (taken >= limit) break
  }

  return { date: ymdWarsaw(nowMs), count: taken, matches: out }
}

/** Liczniki dni dla kalendarza — zgodne z tym, co faktycznie generujemy. */
export interface DemoCalendarDay {
  date: string
  tips: number
  matches: number
  leagues: number
  analyzed: number
}

export function demoCalendarDays(nowMs: number = Date.now()): DemoCalendarDay[] {
  return demoDates(nowMs).map((date) => {
    const p = demoTipsPayload(date, nowMs)
    return {
      date,
      tips: p.count,
      matches: p.matches.length,
      leagues: new Set(p.matches.map((m) => m.league)).size,
      analyzed: p.matches.length,
    }
  })
}
