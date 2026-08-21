# Trzy poprawki UI — zakładki Analiza i Liga na /mecz/{id}

**Branch:** `claude/determined-galileo-1Vsu7` (nie mergowane do main)
**Backend:** nie ruszany — poza fixem #3, który tylko **czyta** nowe pole
`season_not_seeded`/`season`, już zwracane przez `/public-api/league/{code}/standings`.

## 1 — Macierz wyników: nieaktualna kopia + brak wyjaśnienia

**Warunek faktycznie sprawdzany przez kod** (`components/match-detail.tsx:385`,
sekcja `[D] HEATMAPA`): `match.score_matrix` — pole `number[][] | null` z
`lib/oracle-map.ts`, wypełniane przez `adaptScoreMatrix()` (linie 754-801)
z jednego z trzech źródeł: surowej macierzy Oracle (`score_matrix` /
`scoreline_matrix` / `dixon_coles_matrix`) **lub**, gdy jej brak, z
`score_distribution` (rozkładu wyników) jako fallback. Zwraca `null`, gdy
żadne z tych źródeł nie zawiera realnych danych.

„Dostępna tylko dla meczów z pełnym modelem (np. MŚ)" było nieaktualne —
odniesienie do Mistrzostw Świata to relikt sprzed usunięcia sekcji Mundialu
2026 z frontu (wcześniejsza sesja, zadanie #1 w historii tego projektu).
Warunek w kodzie nigdy nie sprawdzał nazwy rozgrywki — tylko obecność danych
z modelu.

### Diff

```diff
             {match.score_matrix ? (
-              <LazyMount height={360}>
-                <ScoreHeatmap matrix={match.score_matrix} home={match.home} away={match.away} highlightThriller={hasThriller} />
-              </LazyMount>
+              <>
+                <p className="mb-3 text-xs leading-5 text-[color:var(--text-muted)]">
+                  Siatka prawdopodobieństw każdego dokładnego wyniku, wyliczona z modelu
+                  Poissona/Dixon-Coles: wiersze = gole {match.home}, kolumny = gole {match.away}.
+                  Im jaśniejsza komórka, tym wyższa szansa na taki wynik.
+                </p>
+                <LazyMount height={360}>
+                  <ScoreHeatmap matrix={match.score_matrix} home={match.home} away={match.away} highlightThriller={hasThriller} />
+                </LazyMount>
+              </>
             ) : (
-              <EmptyState icon={BarChart3} title="Brak macierzy" description="Dostępna tylko dla meczów z pełnym modelem (np. MŚ)." />
+              <EmptyState
+                icon={BarChart3}
+                title="Brak macierzy"
+                description="Macierz pojawia się, gdy model ma wystarczające dane historyczne obu drużyn, by wyliczyć rozkład prawdopodobieństwa wyników (Poisson/Dixon-Coles) — niedostępna dla części lig i meczów."
+              />
             )}
```

Opis dodany nad macierzą (nie duplikuje istniejącej legendy pod nią, która
tłumaczy skalę jasności — dodany fragment tłumaczy **co to jest** i **jak
zorientowane są osie**, czego wcześniej brakowało).

## 2 — Wykres formy: BTTS niewidoczny na samej linii

Sparkline formy (`components/form-panel.tsx`, `FormSparkline`) rysował
punkty jako `dot={false}` — BTTS był widoczny wyłącznie jako tag `MarketFlag`
w liście meczów pod wykresem. Dodano niestandardowy renderer kropki
(`BttsDot`), kolorowany wynikiem BTTS tego meczu (zielony = tak, czerwony =
nie, szary = nieznany), plus mini-legendę pod wykresem.

### Diff

```diff
+// Kolor kropki na sparkline = wynik rynku BTTS w tym meczu (nie forma W/D/L,
+// która już ma własną linię/kwadraty obok) — tak żeby wzorzec BTTS był
+// widoczny na pierwszy rzut oka, bez scrollowania do listy meczów pod spodem.
+const BTTS_DOT_COLOR = { true: "#34d399", false: "#fb7185", unknown: "rgba(255,255,255,0.35)" } as const
+
+function bttsDotColor(btts: boolean | null | undefined): string {
+  return btts == null ? BTTS_DOT_COLOR.unknown : btts ? BTTS_DOT_COLOR.true : BTTS_DOT_COLOR.false
+}
+
+function BttsDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: { btts: boolean | null | undefined } }) {
+  if (cx == null || cy == null) return null
+  return <circle cx={cx} cy={cy} r={3.5} fill={bttsDotColor(payload?.btts)} stroke="#03050a" strokeWidth={1} />
+}
+
 function FormSparkline({ matches }: { matches: FormMatch[] }) {
   const data = [...matches].reverse().map((m) => ({
     v: m.result === "W" ? 1 : m.result === "D" ? 0.5 : 0,
+    btts: m.btts,
     label: `...`,
   }))
   if (data.length < 2) return null
   return (
-    <div className="mb-3 h-12 w-full">
+    <div className="mb-1.5 h-12 w-full">
       <ResponsiveContainer width="100%" height="100%">
         <LineChart data={data} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
           <YAxis hide domain={[-0.1, 1.1]} />
           <Tooltip content={<SparkTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
-          <Line type="monotone" dataKey="v" stroke="#58E6F5" strokeWidth={2} dot={false} isAnimationActive={false} />
+          <Line type="monotone" dataKey="v" stroke="#58E6F5" strokeWidth={2} dot={<BttsDot />} isAnimationActive={false} />
         </LineChart>
       </ResponsiveContainer>
     </div>

@@ w render FormPanel:
-              {/* sparkline trendu formy (W=1/D=0.5/L=0) */}
+              {/* sparkline trendu formy (W=1/D=0.5/L=0), kropki = wynik BTTS */}
               <FormSparkline matches={form.matches} />
+              <div className="mb-3 flex items-center gap-3 text-[10px] text-white/45">
+                <span className="flex items-center gap-1">
+                  <span className="h-2 w-2 rounded-full" style={{ background: BTTS_DOT_COLOR.true }} /> BTTS tak
+                </span>
+                <span className="flex items-center gap-1">
+                  <span className="h-2 w-2 rounded-full" style={{ background: BTTS_DOT_COLOR.false }} /> BTTS nie
+                </span>
+              </div>
```

Kolory zgodne z już istniejącą konwencją w tym samym pliku (`MarketFlag`:
emerald = trafione, rose = nietrafione).

## 3 — `season_not_seeded` nieobsłużone (zakładka Liga)

Backend zwraca teraz `season_not_seeded` (bool) i `season` obok `standings`
w `/public-api/league/{code}/standings`, ale nic w kodzie tego nie czytało —
`StandingsTable` renderowałaby cokolwiek przyszło w `standings`, nawet gdyby
było nieaktualne/puste mimo tej flagi. Poprawiono cały łańcuch: adapter →
route handler → komponent.

### `lib/league.ts` — `getStandingsWithMeta()` czyta i przekazuje pole dalej

```diff
+export interface StandingsWithMeta {
+  standings: StandingRow[]
+  leagueLogo: string | null
+  seasonNotSeeded: boolean
+  season: string | null
+}
+
-export async function getStandingsWithMeta(
-  code: string,
-): Promise<{ standings: StandingRow[]; leagueLogo: string | null }> {
-  if (!isOracleConfigured()) return { standings: [], leagueLogo: null }
+export async function getStandingsWithMeta(code: string): Promise<StandingsWithMeta> {
+  if (!isOracleConfigured()) return { standings: [], leagueLogo: null, seasonNotSeeded: false, season: null }
   try {
     const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/standings`)
-    return { standings: adaptStandings(data), leagueLogo: adaptLeagueLogo(data) }
+    const r = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
+    return {
+      standings: adaptStandings(data),
+      leagueLogo: adaptLeagueLogo(data),
+      seasonNotSeeded: r.season_not_seeded === true,
+      season: r.season != null ? String(r.season) : null,
+    }
   } catch (err) {
     console.error("getStandingsWithMeta: Oracle niedostępne →", err)
-    return { standings: [], leagueLogo: null }
+    return { standings: [], leagueLogo: null, seasonNotSeeded: false, season: null }
   }
 }
```

### `app/api/league/[code]/standings/route.ts` — przekazuje pola w JSON-ie

```diff
-    const { standings, leagueLogo } = await getStandingsWithMeta(code)
-    return NextResponse.json({ standings, league_logo: leagueLogo })
+    const { standings, leagueLogo, seasonNotSeeded, season } = await getStandingsWithMeta(code)
+    return NextResponse.json({ standings, league_logo: leagueLogo, season_not_seeded: seasonNotSeeded, season })
```

### `components/standings-table.tsx` — sprawdza flagę PRZED rows.length

```diff
   const [rows, setRows] = useState<StandingRow[] | null>(null)
   const [loading, setLoading] = useState(true)
+  const [seasonNotSeeded, setSeasonNotSeeded] = useState(false)
+  const [season, setSeason] = useState<string | null>(null)

   useEffect(() => {
     ...
       .then((d) => {
         if (!active) return
+        setSeasonNotSeeded(d?.season_not_seeded === true)
+        setSeason(d?.season != null ? String(d.season) : null)
         const list: StandingRow[] = Array.isArray(d?.standings) ? d.standings : []
         ...
       })
-      .catch(() => active && setRows([]))
+      .catch(() => {
+        if (!active) return
+        setSeasonNotSeeded(false)
+        setSeason(null)
+        setRows([])
+      })
     ...
   }, [leagueCode])

   if (loading) { ... }

+  if (seasonNotSeeded) {
+    return (
+      <EmptyState
+        icon={Table2}
+        title="Tabela niedostępna"
+        description={season ? `Tabela sezonu ${season} jeszcze niedostępna.` : "Tabela tego sezonu jeszcze niedostępna."}
+      />
+    )
+  }
+
   if (!rows || rows.length === 0) {
     return <EmptyState icon={Table2} title="Brak tabeli ligowej" description="Tabela niedostępna dla tej rozgrywki." />
   }
```

`seasonNotSeeded`/`season` sprawdzane **przed** `rows.length === 0` — zgodnie
z opisem zadania, `standings` może przyjść niepuste-ale-nieaktualne mimo
`season_not_seeded=true`, więc kolejność ma znaczenie: flaga wygrywa zawsze,
niezależnie od tego, co jest w `standings`. `false` → zero zmian w
dotychczasowym renderowaniu (ścieżka nie zmieniona poniżej tego warunku).

## Poza zakresem (celowo nietknięte)

- `components/ligi-view.tsx` (strona `/ligi`, osobna tabela ligowa) —
  zadanie dotyczyło wyłącznie zakładki „Liga" na `/mecz/{id}`.
- `components/match/score-matrix.tsx` (`ScoreMatrix`, sekcja `[A2]`
  zabramkowana `lambda_home != null`, wyłącznie demo) — inny komponent niż
  `[D] HEATMAPA`/`ScoreHeatmap`, do którego odnosiło się zadanie 1.

## Build i weryfikacja

- `npx tsc --noEmit` — czysto po **każdej** z trzech zmian z osobna.
- `npm run build` — czysto po wszystkich trzech (14/14 stron).
- Backup plików sprzed zmian: `raporty/backup-2026-08-20/` (lokalnie, nie
  commitowany — historia w git już jest pełnym backupem).

## Bez zmian env / sekretów / backendu

Fix #3 czyta nowe pole z **istniejącej** odpowiedzi Oracle
(`/public-api/league/{code}/standings`) — nic w kontrakcie API ani w
zmiennych środowiskowych się nie zmienia.
