# Post-migration cleanup — podsumowanie

**Repo:** `mtkittles/nova-pulse` · **PR:** [#68](https://github.com/mtkittles/nova-pulse/pull/68) (merge, zmergowany do `main`)
**Branch:** `fix/post-migration-cleanup` · **Data:** 2026-08-02
**Status:** ✅ ukończone — `next build` exit 0

---

## Zakres — trzy naprawy w jednym PR

### 1. Sieroty — koniec martwych linków „Nie znaleziono meczu"
- **`Tip.isOrphan`** ustawiane **raz w `adaptTip`** (`kickoff_utc == null && match_status == null`).
- Wszystkie miejsca z linkami do `/mecz/{event_id}` gate'ują link gdy `isOrphan`:
  - `tip-card` (landing, /typy) — `tip.isOrphan ?? fallback` + „Szczegóły wkrótce".
  - `match-tip-card` — orphan gdy dowolny tip grupy jest sierotą.
  - `stats-screen` „Ostatnie rozliczone typy" — wiersz nieklikalny.
  - `landing-page.tipHref` — zwraca `undefined` dla sierot.
- `MatchLiveCard` / `ranking-team-card` / `team-page` korzystają z endpointów które nie zwracają sierot — bez zmian.

### 2. Usunięty Mundial 2026
**Pliki/foldery skasowane:**
- `app/mundial/{page.tsx, loading.tsx, grupy/page.tsx, mecze/page.tsx, drabinka/page.tsx}`
- `components/mundial/{bracket-view.tsx, groups-view.tsx, matches-view.tsx, wc-hero.tsx, wc-match-card.tsx}`
- `lib/worldcup.ts`

**Referencje wyczyszczone:**
- `app/page.tsx` — usunięte `getWCOverview`, `wcTips`, `isWorldCup`, prop `wcPhase`.
- `components/landing-page.tsx` — sekcja „Mundial", `Trophy` import, `wcTips/wcPhase/wcRunning`; footer link `/mundial` → dodane `/live` + `/ranking`.
- `components/app-nav.tsx` — zakładka „Mundial" + `Trophy` z importów.
- `components/calendar.tsx` — ikona 🏆 (has_worldcup).
- `lib/oracle-map.ts` — detekcja `has_worldcup` w `adaptCalendar`.
- `lib/calendar.ts` — `has_worldcup: true` z danych mockowych.
- `lib/extra-types.ts` — cały blok `WC*` (10 typów) + `has_worldcup` z `CalendarDay`.
- `lib/design.ts` — entry `WC` z `MODE_META` + `ModeKey` zawężone do `BetType`.

**Route handler `/api/worldcup/*` nie istniał w repo** (dane MŚ przychodzą wprost z Oracle). **Dane MŚ w Oracle zostają nienaruszone.**

### 3. Landing polish
Flow po usunięciu WC section (leżała między „Jak działa" a „Plany"):
**HERO → LIVE TICKER → Jak czytać → Dziś → Proof bar → Jak działa → Plany → Stopka**.
Brak pustych sekcji ani rozjazdów spacingu — każda sekcja ma własne `py-14`.

---

## Statystyki diffu
- **23 pliki**, +24/−1423 (netto: ~1400 linii kodu mniej — czysta dług techniczny redukcja).
- Usunięcia: ~1200 linii MŚ + ~100 linii cleanupu; dodania: kilka linii `isOrphan` + gating.

## Zasady utrzymane
- Zero zmian w wykresach (Recharts Brush), filtrach `/typy`, design tokens (Graphite Night), TeamBadge.
- Sesja/Oracle-key server-side bez zmian. Brak nowych env vars.
- `null → "—"` (Sprint 1) zachowane.

## Pliki
`lib/types.ts`, `lib/oracle-map.ts`, `lib/extra-types.ts`, `lib/calendar.ts`, `lib/design.ts`, `app/page.tsx`, `components/{landing-page,app-nav,calendar,tip-card,match-tip-card,stats-screen}.tsx`. Skasowane: 11 plików Mundialu + `lib/worldcup.ts`.

## Uwaga porządkowa
W repo pozostały porzucone branche zdalne (m.in. `feat/redesign-landing-typy`, `feat/mundial`, `fix/mundial-p0`, `redesign-homepage`) — do opcjonalnego wyczyszczenia (brak funkcjonalnej wartości, całość jest już na main).
