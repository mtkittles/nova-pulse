# Naprawa — 3 bugi w `adaptMatchDetailed()` + efekt uboczny (strzelcy)

**Nawiązuje do:** `raporty/DIAGNOZA_frontend_brak_danych_mecz.md`
**Plik:** `lib/oracle-map.ts`, funkcja `adaptMatchDetailed()`
**Test:** `af_1490402` (Real Salt Lake vs FC Dallas, MLS) — dokładnie ten sam raw JSON z curl w diagnozie

## Backup przed edycją

Kopia `lib/oracle-map.ts` sprzed zmian zrobiona lokalnie przed edycją (a
dodatkowo pełna historia jest w git — commit `4909329` ma oryginalną wersję
pliku: `git show 4909329:lib/oracle-map.ts`).

## Co zostało poprawione

### A) `home_id` / `away_id` — brak formy drużyn

**Przed** (`lib/oracle-map.ts`, było ~926-927):
```ts
home_id: pickId(m, ["home_id", "home_team_id", "homeId"]),
away_id: pickId(m, ["away_id", "away_team_id", "awayId"]),
```
Czytało tylko z `m` (= `r.match`). Realny kształt Oracle trzyma
`home_team_id`/`away_team_id` na **najwyższym poziomie** odpowiedzi (`r`), nie
wewnątrz `r.match`.

**Po:**
```ts
home_id: pickId(m, ["home_id", "home_team_id", "homeId"]) ?? pickId(r, ["home_id", "home_team_id", "homeId"]),
away_id: pickId(m, ["away_id", "away_team_id", "awayId"]) ?? pickId(r, ["away_id", "away_team_id", "awayId"]),
```
Druga próba na `r` jako fallback — `m` zostaje pierwsza (kompatybilność z
trybem demo, gdzie `m === r`, więc nic się tam nie zmienia).

### B) `leagueCode` — brak tabeli ligowej

**Przed:**
```ts
league: getLeagueName(String(m.league_code ?? r.league_code ?? m.league ?? "")),
leagueCode: String(m.league_code ?? r.league_code ?? m.league ?? ""),
```
Oracle nie zwraca już osobnego kodu ligi w `/detailed` — jedyne pole to
`match.league = "Major League Soccer"` (pełna nazwa). Wpisanie jej wprost
jako `leagueCode` psuło `/api/league/{code}/standings` (Oracle nie rozpoznaje
`"Major League Soccer"` jako kodu) **i** blokowało poprawny fallback w
`app/mecz/[id]/page.tsx:35` (`match.leagueCode || leagueCodeByName(...)`) —
skoro `leagueCode` był już (błędnie) niepusty, `leagueCodeByName()` nigdy się
nie wykonywał, mimo że mapa w `lib/leagues.ts` ma gotowy wpis
`"major league soccer" → "MLS"`.

**Po:**
```ts
const leagueCode = String(m.league_code ?? r.league_code ?? leagueCodeByName(String(m.league ?? "")) ?? "")
// ...
league: leagueCode ? getLeagueName(leagueCode) : String(m.league ?? "—"),
leagueCode,
```
`leagueCodeByName()` (import dodany z `./leagues`) wchodzi do łańcucha
fallbacków PRZED surową nazwą — `leagueCode` jest teraz albo realnym kodem,
albo pustym stringiem (nigdy pełną nazwą podszywającą się pod kod). Pusty
`leagueCode` jest już obsłużony w UI (`match-detail.tsx`: zakładka „Liga"
pokazuje `EmptyState` zamiast wołać standings z bezsensownym URL-em) — to
strzał czystszy niż poprzedni stan także dla lig spoza mapy.

### C) `h2h_matches` — brak historycznych spotkań

**Przed:**
```ts
const rawH2h = Array.isArray(r.h2h) ? (r.h2h as unknown[]) : Array.isArray(m.h2h) ? (m.h2h as unknown[]) : []
```
Zakładał, że `r.h2h` samo jest tablicą. W realnym kształcie `r.h2h` to
**obiekt** `{ count, btts_pct, over_1_5_pct, score_distribution, matches: [...] }`
— lista jest zagnieżdżona pod `.matches`.

**Po:**
```ts
const rawH2h = Array.isArray(r.h2h)
  ? (r.h2h as unknown[])
  : Array.isArray(rec(r.h2h).matches)
    ? (rec(r.h2h).matches as unknown[])
    : Array.isArray(m.h2h)
      ? (m.h2h as unknown[])
      : []
```
`Array.isArray(r.h2h)` zostaje **pierwszym** sprawdzanym wariantem —
kompatybilność wsteczna ze starym kształtem, wciąż używanym w trybie demo
(`lib/demo-tips.ts`, `h2h` jako płaska tablica).

### Efekt uboczny — `home_scorers` / `away_scorers` (TopScorers)

Wspomniane w diagnozie jako nieszkodliwe, ale wynikające z tej samej migracji
— poprawione przy okazji:

**Przed:**
```ts
home_scorers: adaptScorers(r.home_scorers ?? r.home_top_scorers ?? rec(r.home).scorers),
away_scorers: adaptScorers(r.away_scorers ?? r.away_top_scorers ?? rec(r.away).scorers),
```
**Po:**
```ts
home_scorers: adaptScorers(r.home_scorers ?? r.home_top_scorers ?? rec(r.home).scorers ?? rec(r.scorers).home),
away_scorers: adaptScorers(r.away_scorers ?? r.away_top_scorers ?? rec(r.away).scorers ?? rec(r.scorers).away),
```
Nowy kształt trzyma strzelców pod `r.scorers.home` / `r.scorers.away` —
dołożone jako ostatni fallback (stare pola nadal mają pierwszeństwo, więc
demo bez zmian).

### Poza zakresem (celowo nietknięte)

`home_metrics` / `away_metrics` (`teamMetrics(r.home_stats ?? m.home_stats ?? ...)`,
używane wyłącznie w `TeamStrength`, zabramkowanym przez
`match.lambda_home != null`) — zgodnie z poleceniem, bez zmian. To pole
faktycznie nie ma dziś odpowiednika w realnym kształcie Oracle (zastąpione
przez `form.home`/`form.away`), ale sekcja i tak nigdy się nie renderuje poza
trybem demo, więc `null` tutaj jest nieszkodliwe.

## Test — weryfikacja na dokładnym payloadzie z diagnozy

Ponieważ to środowisko (Claude Code na webie) nie ma bezpośredniego dostępu
do Oracle ani do domeny `*.vercel.app` (egress zablokowany przez politykę
sesji — potwierdzone w poprzednim kroku diagnozy), zamiast kolejnego round-tripu
przez preview zweryfikowano `adaptMatchDetailed()` **bezpośrednio**, lokalnie
(`npx tsx`), podając dokładnie ten sam surowy JSON co w punkcie 4 diagnozy
(`af_1490402`) oraz osobno kształt trybu demo (z `lib/demo-tips.ts`) jako test
regresji. `"server-only"` (pakiet blokujący import poza serwerem Next.js) był
tymczasowo usunięty z pierwszej linii lokalnej kopii pliku na czas testu —
sama kopia nie została nigdzie zacommitowana ani wysłana.

**Realny kształt (af_1490402):**

| Pole | Wynik |
|---|---|
| `home_id` | `8193` ✅ (było `null`) |
| `away_id` | `8201` ✅ (było `null`) |
| `leagueCode` | `"MLS"` ✅ (było `"Major League Soccer"`) |
| `league` | `"Major League Soccer"` ✅ (bez zmian — już wcześniej wyglądało OK przypadkiem, teraz poprawnie przez słownik kodów) |
| `h2h_matches.length` | `5` ✅ (było `0`) |
| `h2h_summary` | `{home_wins:1, away_wins:2, draws:2, btts_pct:80, avg_goals:3.6}` ✅ (było `null`) |
| `away_scorers` | `[{player:"P. Musa", goals:13, assists:2}]` ✅ (było `[]`) |
| `home_scorers` | `[]` (Oracle faktycznie nie podał strzelców gospodarzy dla tego meczu — poprawnie pusta, nie błąd) |

**Kształt demo (regresja — bez zmian, jak oczekiwano):**

| Pole | Wynik |
|---|---|
| `home_id` | `101` ✅ (niezmienione) |
| `away_id` | `202` ✅ (niezmienione) |
| `leagueCode` | `"J1"` ✅ (niezmienione — pole `league_code` nadal ma pierwszeństwo) |
| `h2h_matches.length` | `2` ✅ (płaska tablica nadal działa — ścieżka kompatybilności wstecznej z punktu C zadziałała) |

Konsekwencja w UI (na podstawie tego, co czytają komponenty — patrz diagnoza):
- `FormPanel` (`components/form-panel.tsx`) dostanie `teamId=8193`/`8201` →
  odpyta `/api/team/{id}/form` zamiast renderować „Brak danych o formie”.
- `StandingsTable` (`components/standings-table.tsx`) dostanie `leagueCode="MLS"`
  → `/api/league/MLS/standings` zamiast `/api/league/Major%20League%20Soccer/standings`.
- Zakładka H2H (`match-detail.tsx`) i pigułka licznika w `MeczTabs` pokażą 5
  meczów zamiast pustego stanu.
- `TopScorers` pokaże P. Musa (FC Dallas) zamiast ukrytej/pustej sekcji.

## Build

- `npx tsc --noEmit` — czysto.
- `npm run build` — czysto (14/14 stron), `app/api/debug/match-raw/[id]` **nie
  ma już** na liście route'ów (usunięty w tym samym commicie).

## Sprzątanie

- Tymczasowy endpoint diagnostyczny `app/api/debug/match-raw/[id]/route.ts`
  usunięty (już wcześniej, w commicie diagnozy).
- Lokalna testowa kopia adaptera (`lib/_tmp_test_oracle_map.ts`, użyta tylko
  do uruchomienia testu z `"server-only"` usuniętym z pierwszej linii)
  skasowana po teście — nie trafiła do commita.

## Bez zmian env / sekretów

Poprawka jest czysto logiką mapowania JSON→typ w jednym pliku
(`lib/oracle-map.ts`) — brak nowych zmiennych środowiskowych, brak zmian w
sekretach.
