# Podłączenie frontu do trzech pól backendu — kursy, flagi form, season_not_seeded

**Branch:** `claude/determined-galileo-1Vsu7` (nie mergowane do main)
**Weryfikacja kontraktu:** żywy curl przez tymczasowy debug endpoint
(`/api/debug/contract-check`, usunięty w tym samym commicie), dla
`af_1490402` / `team_id=8193` / `league_code=MLS`. Zgodnie z poleceniem —
**żaden z trzech fixów nie został napisany na podstawie zgadywania z opisu
zadania**, tylko na podstawie realnej odpowiedzi Oracle. To już drugi raz
w tym repo, gdy realny kontrakt różni się od dokumentacji/opisu zadania
(pierwszy: `adaptMatchDetailed()`, poprzednia sesja) — więc to był dobry
odruch, nie formalność: **wszystkie trzy** pola miały nazwy inne, niż
sugerował opis zadania (patrz niżej).

## Realny surowy JSON (skrót — pełny w historii czatu)

```json
{
  "match_detailed": {
    "odds": {"home":2,"draw":3.8,"away":3.4,"btts_yes":1.44,"btts_no":2.62,"over_1_5":1.14,"over_2_5":1.5,"over_3_5":2.2}
  },
  "team_form": {
    "form_by_market": [{"btts":true,"team_over_15":true,"over_15":true,"over_25":true, "...": "..."}]
  },
  "league_scorers": {"season": 2026, "season_not_seeded": false, "scorers": [...]}
}
```

## 1 — Kursy w zakładce Prognoza

**Rozbieżność z opisem zadania:** zadanie sugerowało pole `odds_markets` z
kluczami `home_win`/`away_win`. Realny raw ma **`odds`** (nie
`odds_markets`) z kluczami **`home`/`away`** (nie `home_win`/`away_win`),
plus `over_1_5`/`over_2_5`/`over_3_5` (nie `over15`/`over25`/`over35`).
Adapter czytał `r.odds_markets` — pole, które w realnej odpowiedzi **w
ogóle nie istnieje** — stąd zawsze same „—" niezależnie od tego, czy Oracle
miał dane. Dokładnie ta sama klasa błędu co `adaptMatchDetailed()`
(kontrakt zmienił nazwę pola, adapter został przy starej).

Real payload nie ma w ogóle `cs_32`/`cs_23`/`home_team_o15`/`away_team_o15`
— te cztery karty w siatce zostają na „—" (fallback), zgodnie z poleceniem
(„myślnik zostaje jako fallback gdy odds:null"). Dodałem za to kartę
**„Over 1.5"**, bo `over_1_5` jest w realnych danych, a wcześniej nie miał
żadnej reprezentacji w siatce (BTTS/Over 1.5/Mix/Thriller to zresztą
podstawowe rynki tego bota — pominięcie akurat Over 1.5 byłoby dziurą).

### Diff — `lib/extra-types.ts` (nowe pole w typie)

```diff
 export interface OddsMarkets {
   btts_yes: number | null
   btts_no: number | null
   home_win: number | null
   draw: number | null
   away_win: number | null
+  over15: number | null
   over25: number | null
   over35: number | null
   cs_32: number | null
```

### Diff — `lib/oracle-map.ts` (`adaptOddsMarkets`)

```diff
-// Kursy rynków: czytaj 1:1 z r.odds_markets (klucze zgodne z Oracle). Brak → null.
+// Kursy rynków. Realny kontrakt Oracle (/match/{id}/detailed): pole "odds"
+// {home, draw, away, btts_yes, btts_no, over_1_5, over_2_5, over_3_5} —
+// zweryfikowane bezpośrednim curl. NIE "odds_markets" z home_win/away_win/
+// over25/over35, jak wcześniej zakładał ten adapter (stąd zawsze same "—"
+// na /mecz/{id}). Stary klucz "odds_markets" zostaje jako fallback — tego
+// kształtu używa tryb demo (lib/demo-tips.ts, demoOddsMarkets()).
 export function adaptOddsMarkets(r: unknown): OddsMarkets | null {
-  const raw = (r as Record<string, unknown>)?.odds_markets
+  const rr = r as Record<string, unknown>
+  const raw = rr?.odds ?? rr?.odds_markets
   if (!raw || typeof raw !== "object") return null
   const o = raw as Record<string, number | null>
   return {
     btts_yes: o.btts_yes ?? null,
     btts_no: o.btts_no ?? null,
-    home_win: o.home_win ?? null,
+    home_win: o.home_win ?? o.home ?? null,
     draw: o.draw ?? null,
-    away_win: o.away_win ?? null,
-    over25: o.over25 ?? null,
-    over35: o.over35 ?? null,
+    away_win: o.away_win ?? o.away ?? null,
+    over15: o.over_1_5 ?? o.over15 ?? null,
+    over25: o.over25 ?? o.over_2_5 ?? null,
+    over35: o.over35 ?? o.over_3_5 ?? null,
     cs_32: o.cs_32 ?? null,
     cs_23: o.cs_23 ?? null,
```

### Diff — `components/match-detail.tsx` (nowa karta + highlight)

```diff
   if (bt === "1" || (bt === "1x2" && side === "home")) return "home_win"
   if (bt === "x" || (bt === "1x2" && (side === "x" || side === "draw"))) return "draw"
   if (bt === "2" || (bt === "1x2" && side === "away")) return "away_win"
+  if (bt === "o15" || bt === "over15") return "over15"
   if (bt === "o25" || bt === "over25") return "over25"
   ...
   { key: "away_win", label: "2 · Gość" },
+  { key: "over15", label: "Over 1.5" },
   { key: "over25", label: "Over 2.5" },
```

`lib/match.ts` (`mockDetailed`, dane testowe bez Oracle) dostał `over15:
1.25` w tym samym miejscu — bez tego `tsc` zgłaszał brakujące pole w typie.

## 2 — Podświetlanie O1.5/O2.5 w zakładce Analiza

**Rozbieżność z opisem zadania:** zadanie wskazywało `form.home.matches[]`
z `/detailed` z polami `over_1_5`/`over_2_5`/`team_over_15`. Realny
komponent (`FormPanel`, ten z działającym BTTS) **nie czyta** `/detailed` w
ogóle — pobiera dane osobnym zapytaniem z `/api/team/{id}/form` →
`getTeamForm()` → `adaptForm()`. Ten endpoint zwraca listę pod kluczem
**`form_by_market`**, a per-mecz flagi to **`over_15`/`over_25`** (nie
`over_1_5`/`over_2_5` — bez kropki dziesiętnej we froncie nazwy!) i
**`team_over_15`** (to akurat zgadzało się z opisem zadania). Ciekawostka:
`/detailed`'s WŁASNY, osobny, nieużywany dziś embed `form.home/away.matches[]`
ma inne nazwy niż `/team/{id}/form` (`over_1_5`/`over_2_5` tam, `over_15`/
`over_25` tu) — Oracle nie jest spójne między tymi dwoma endpointami mimo
identycznej semantyki pól.

**Root cause:** `adaptForm()` sprawdzał `m.over_1_5 ?? m.over15` — żaden z
tych dwóch nie pasuje do realnego `over_15`. Dla `total`/`gf` (fallback przy
braku jawnego pola) real payload też nie ma `home_score`/`away_score`/`gf`/
`ga` (tylko połączone `score: "3:4"`) — więc fallback też zwracał `null`.
BTTS działał, bo `m.btts` to osobne, zawsze jawne pole, niezależne od tego
problemu.

### Diff — `lib/oracle-map.ts` (`adaptForm`)

```diff
     const total = gf != null && ga != null ? gf + ga : null
     const btts = boolOrNull(m.btts) ?? (gf != null && ga != null ? gf > 0 && ga > 0 : null)
-    const over15 = boolOrNull(m.over_1_5 ?? m.over15) ?? (total != null ? total > 1 : null)
-    const over25 = boolOrNull(m.over_2_5 ?? m.over25) ?? (total != null ? total > 2 : null)
-    const teamOver15 = boolOrNull(m.team_over_1_5 ?? m.team_over15) ?? (gf != null ? gf > 1 : null)
+    const over15 = boolOrNull(m.over_15 ?? m.over_1_5 ?? m.over15) ?? (total != null ? total > 1 : null)
+    const over25 = boolOrNull(m.over_25 ?? m.over_2_5 ?? m.over25) ?? (total != null ? total > 2 : null)
+    const teamOver15 = boolOrNull(m.team_over_15 ?? m.team_over_1_5 ?? m.team_over15) ?? (gf != null ? gf > 1 : null)
```

Stare nazwy zostają jako dalszy fallback (kompatybilność wsteczna — na
wypadek gdyby coś kiedyś faktycznie skonsumowało `/detailed`'s
`form.home/away.matches[]` z jego własną, inną konwencją nazw).

## 3 — `season_not_seeded` dla strzelców

**Zgodne z opisem zadania** — jedyny z trzech, gdzie realny kształt trafił
1:1: `league_scorers.season` (liczba, nie string) i
`league_scorers.season_not_seeded` (bool) jako rodzeństwo `scorers`, tak
samo jak w `/standings` (fix z poprzedniej sesji). Wzorzec z
`standings-table.tsx` skopiowany 1:1: sprawdzane **przed** `rows.length ===
0`, resetowane w gałęzi `catch`.

### Diff — `lib/league.ts` (`getScorers` zwraca meta)

```diff
-export async function getScorers(code: string): Promise<Scorer[]> {
-  if (!isOracleConfigured()) return []
+export interface ScorersWithMeta {
+  scorers: Scorer[]
+  seasonNotSeeded: boolean
+  season: string | null
+}
+
+export async function getScorers(code: string): Promise<ScorersWithMeta> {
+  if (!isOracleConfigured()) return { scorers: [], seasonNotSeeded: false, season: null }
   try {
     const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/scorers`)
-    return adaptScorers(data)
+    const r = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
+    return {
+      scorers: adaptScorers(data),
+      seasonNotSeeded: r.season_not_seeded === true,
+      season: r.season != null ? String(r.season) : null,
+    }
   } catch (err) {
     console.error("getScorers: Oracle niedostępne →", err)
-    return []
+    return { scorers: [], seasonNotSeeded: false, season: null }
   }
 }
```

`getScorers` miał tylko jednego wywołującego (route handler poniżej), więc
zamiast dokładać drugą, równoległą funkcję `getScorersWithMeta` (jak przy
standings, gdzie `getStandings()` bez meta ma inne, osobne zastosowanie —
`resolveTeamIds()`), po prostu poszerzyłem zwracany kształt tej jedynej.

### Diff — `app/api/league/[code]/scorers/route.ts`

```diff
-    const data = await getScorers(code)
-    return NextResponse.json({ scorers: data })
+    const { scorers, seasonNotSeeded, season } = await getScorers(code)
+    return NextResponse.json({ scorers, season_not_seeded: seasonNotSeeded, season })
```

### Diff — `components/top-scorers.tsx`

```diff
+  const [seasonNotSeeded, setSeasonNotSeeded] = useState(false)
+  const [season, setSeason] = useState<string | null>(null)

   useEffect(() => {
     ...
-      .then((d) => active && setRows(Array.isArray(d?.scorers) ? d.scorers : []))
-      .catch(() => active && setRows([]))
+      .then((d) => {
+        if (!active) return
+        setSeasonNotSeeded(d?.season_not_seeded === true)
+        setSeason(d?.season != null ? String(d.season) : null)
+        setRows(Array.isArray(d?.scorers) ? d.scorers : [])
+      })
+      .catch(() => {
+        if (!active) return
+        setSeasonNotSeeded(false)
+        setSeason(null)
+        setRows([])
+      })
     ...

+  if (seasonNotSeeded) {
+    return (
+      <section className="mt-5">
+        <h2 className="...">Top strzelcy</h2>
+        <EmptyState
+          icon={Trophy}
+          title="Lista niedostępna"
+          description={season ? `Lista strzelców sezonu ${season} jeszcze niedostępna.` : "..."}
+        />
+      </section>
+    )
+  }
+
   if (!rows || rows.length === 0) return null
```

Wcześniej: brak danych renderował się jako `null` (sekcja cicho znika) —
nierozróżnialne od „liga nie ma jeszcze top strzelców do pokazania" vs
„sezon się jeszcze nie zaczął". Teraz to drugie ma własny, wyraźny
komunikat; pierwsze (`season_not_seeded=false`, po prostu pusta lista)
zachowuje się bez zmian.

## Test — weryfikacja na realnych payloadach (nie tylko tsc)

Puszczone lokalnie przez `npx tsx` (ta sama technika co przy
`adaptMatchDetailed()`), dokładny raw z curl:

| Sprawdzenie | Wynik |
|---|---|
| `adaptOddsMarkets(realDetailed).home_win` | `2` ✅ (z `odds.home`) |
| `adaptOddsMarkets(realDetailed).over15` | `1.14` ✅ (z `odds.over_1_5`) |
| `adaptOddsMarkets(realDetailed).cs_32` | `null` ✅ (Oracle nie podaje — fallback, nie crash) |
| `adaptOddsMarkets(demoRaw).home_win` (stary kształt `odds_markets`) | `2.1` ✅ (regresja: demo bez zmian) |
| `adaptForm(realTeamForm).matches[0].over15/.over25/.teamOver15` | `true/true/true` ✅ (z `over_15`/`over_25`/`team_over_15`) |
| `adaptForm(...).matches[1].over25` | `false` ✅ (jawne pole `false`, nie fallback z total) |
| `adaptForm(...).avg_gf` | `1.5` ✅ (top-level `avg_goals_for`, bez zmian) |

## Build i weryfikacja

- `npx tsc --noEmit` — czysto po każdej z trzech zmian z osobna.
- `npm run build` — czysto (14/14 stron) po wszystkich trzech.
- Backup plików sprzed zmian: `raporty/backup-2026-08-21/` (lokalnie, nie
  commitowany).
- Tymczasowy endpoint `/api/debug/contract-check` usunięty w tym commicie.

## Bez zmian backendu

Wszystkie trzy fixy tylko **czytają** pola, które backend już zwraca — brak
zmian w kontrakcie API, brak nowych zmiennych środowiskowych.
