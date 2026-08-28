# API tips — mapa konsumentów i sposób parsowania

**Repo:** `mtkittles/nova-pulse` · **Data:** 2026-08-03 · **Baza:** `main` @ `336c0ed`
**Zakres:** wyłącznie odczyt, bez zmian w kodzie.

---

## ⚠️ Stan wyjściowy — migracja JEST już wykonana

Zmiana shape'u `{ tips: [...] }` → `{ matches: [{...predictions}] }` została zaimplementowana i zmergowana jako **[PR #69](https://github.com/mtkittles/nova-pulse/pull/69)** (`336c0ed`, 2026-08-03). Poniższa mapa opisuje **stan po migracji**.

---

## Kluczowa obserwacja: `.tips` znaczy trzy różne rzeczy

`grep -rn "\.tips\b"` daje 14 plików, ale tylko **jeden** dotyka surowej odpowiedzi Oracle. Reszta to nasze wewnętrzne struktury o przypadkowo tej samej nazwie pola.

| warstwa | co to jest | ile plików | czy dotyczy zmiany API |
|---|---|---|---|
| **A. Parser surowej odpowiedzi Oracle** | `adaptTips` | **1** | ✅ TAK — jedyne miejsce |
| **B. Konsumenci `TipsResponse` (po adapterze)** | `{ date, tips: Tip[] }` | 6 | ❌ NIE — kontrakt wewnętrzny |
| **C. Fałszywe trafienia** | licznik `int`, `MatchGroup.tips`, `MarketStat.tips` | 7 | ❌ NIE — inna semantyka |

---

## Warstwa A — jedyne miejsce parsujące Oracle

### `lib/oracle-map.ts` — `adaptTips` (linie 160–185)

```ts
export function adaptTips(raw: unknown): TipsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const date = String(r.date ?? new Date().toISOString().slice(0, 10))

  // NOWY shape: { matches: [{ ...match_info, predictions: [{...}] }] }
  if (Array.isArray(r.matches)) {
    const tips: Tip[] = []
    for (const m of r.matches as unknown[]) {
      const mo = (m ?? {}) as Record<string, unknown>
      const preds = Array.isArray(mo.predictions) ? (mo.predictions as unknown[]) : []
      for (const p of preds) {
        const po = (p ?? {}) as Record<string, unknown>
        tips.push(adaptTip({ ...mo, ...po }))   // ← match_info + predykcja
      }
    }
    return { date, tips }
  }

  // STARY shape: { tips: [...] } — fallback wsteczny
  const list = Array.isArray(r.tips) ? r.tips : []
  return { date, tips: list.map(adaptTip) }
}
```

**Mechanizm spłaszczania:** `{...mo, ...po}` — każda predykcja dziedziczy pola meczu (`event_id`, `home_team`, `away_team`, `kickoff_utc`, `match_status`, `home_score`, `away_score`, `home_team_logo`, `away_team_logo`), a własne pola predykcji (`market`, `pick`, `bet_type`, `bet_side`, `odds`, `q_score`, `confidence`, `result`) nadpisują kolizje. Wynik idzie do `adaptTip`.

**Dlaczego spłaszczamy zamiast zwracać strukturę zagnieżdżoną:** komponenty UI (`MatchTipCard`, `LiveView`) i tak grupują po `event_id` przez `groupByMatch()`. Zmiana kontraktu wewnętrznego wymagałaby ruszania 6 plików bez zysku funkcjonalnego.

### Mapowanie nowych nazw pól — `adaptTip` / `mapResult`

| pole w nowym API | pole w `Tip` | miejsce | uwaga |
|---|---|---|---|
| `confidence` | `model_prob` | `oracle-map.ts:122` | `numOrNull(t.model_prob ?? t.confidence)` |
| `result` | `actual_result` | `oracle-map.ts:109` | `t.actual_result ?? t.result` |
| `home_team` | `home` | `oracle-map.ts:134` | `t.home ?? t.home_team` (fallback był od początku) |
| `away_team` | `away` | `oracle-map.ts:135` | jw. |
| `home_team_logo` | `homeLogo` | `oracle-map.ts:137` | `pickLogo(...)` → `null` gdy puste |
| `away_team_logo` | `awayLogo` | `oracle-map.ts:138` | jw. |
| `market` / `pick` | — | — | ⚠️ patrz „Uwagi" niżej |

---

## Warstwa B — konsumenci `TipsResponse` (po adapterze)

Wszystkie czytają `.tips`, ale to **nasz** typ `TipsResponse`, nie surowa odpowiedź Oracle. Bez zmian po migracji.

| plik:linia | kod | co robi |
|---|---|---|
| `lib/tips.ts:65` | `return adaptTips(data).tips` | `getTipsHistory` → `Tip[]` |
| `lib/tips.ts:80` | `return { date: today, tips: adaptTips(data).tips }` | `getLiveWindowTips` → `/tips/active` |
| `lib/tips.ts:61` | `mockTips.tips.filter(...)` | dane testowe gdy Oracle nieskonfigurowany |
| `app/page.tsx:14` | `const tips = today.tips` | landing, sekcja „Dziś" |
| `app/typy/page.tsx:47` | `initialTips={tips.tips}` | SSR-owy seed dla `/typy` |
| `app/live/page.tsx:19` | `<LiveView tips={today.tips} />` | `/live` |

### Bramka kontraktu — `lib/tips.ts:24-29`

```ts
// Kontrakt Oracle: nowy shape { matches: [...] } lub stary { tips: [...] } — akceptuj oba.
function hasTipsOrMatches(x: unknown): boolean {
  if (!x || typeof x !== "object") return false
  const o = x as { tips?: unknown; matches?: unknown }
  return Array.isArray(o.tips) || Array.isArray(o.matches)
}
```

Chroni przed „odpowiedź niezgodna z kontraktem" → pusta lista zamiast crasha.

### Client-side fetch przez własne route handlery

Dwa miejsca fetchują `/api/tips?date=` **po stronie przeglądarki**:

```ts
// components/typy-page.tsx:162-164
const res = await fetch(`/api/tips?date=${d}`)
const data = await res.json()
setTips(Array.isArray(data?.tips) ? data.tips : [])
```

```ts
// components/my-picks.tsx:223-226
const t = await (await fetch(`/api/tips?date=${d}`)).json()
setTips(Array.isArray(t?.tips) ? t.tips.filter((x: Tip) => x.bet_type !== "THRILLER") : [])
```

**To jest bezpieczne** — `/api/tips` (`app/api/tips/route.ts`) zwraca wynik `getTips()`, czyli output adaptera (`TipsResponse`), nie proxy surowego Oracle. Klucz API nigdy nie trafia do przeglądarki (zasada z `CLAUDE.md`).

### Sitemap — jedyny bezpośredni fetch do Oracle poza `lib/tips.ts`

```ts
// app/sitemap.ts:28-34
const data = (await res.json()) as {
  matches?: { event_id?: string | number }[]
  tips?: { event_id?: string | number }[]
}
const rows = data.matches ?? data.tips ?? []
```

Woła `/public-api/tips/history?limit=50` z pominięciem adaptera (potrzebuje tylko `event_id`), więc dostał własną obsługę obu kształtów.

---

## Warstwa C — fałszywe trafienia grepa

Te `.tips` **nie mają nic wspólnego** z odpowiedzią API tips.

| plik:linia | co to naprawdę | typ |
|---|---|---|
| `components/calendar.tsx:124` | `CalendarDay.tips` — licznik typów w dniu | `number` |
| `components/date-strip.tsx:59` | jw. | `number` |
| `components/typy-page.tsx:117` | `calendar.filter((d) => d.tips !== 0)` | `number` |
| `components/my-picks.tsx:222` | jw. | `number` |
| `app/typy/page.tsx:27` | jw. | `number` |
| `components/match-tip-card.tsx:175,192,241` | `MatchGroup.tips` — nasza struktura UI | `Tip[]` |
| `components/match-live-card.tsx:36,73` | `MatchLiveGroup.tips` — jw. | `{tip, status}[]` |
| `components/live-view.tsx:112,115` | jw. (budowanie grupy) | `{tip, status}[]` |
| `components/typy-page.tsx:52` | jw. (`groupByMatch`) | `Tip[]` |
| `components/stats-screen.tsx` (7×) | `MarketStat.tips` / `LeagueStat.tips` / `QScoreBucket.tips` — liczniki w statystykach | `number` |
| `lib/oracle-map.ts:190` | `pickCount` — `r.tips ?? r.total ?? r.count` | `number` |
| `lib/oracle-map.ts:570` | `adaptCalendar` — licznik dnia | `number` |

Analogicznie `.matches` daje fałszywe trafienia: `form.matches` (mecze formy drużyny), `mq.matches` (media query!), `day.matches` (licznik meczów w dniu), `liveMatches` (hook live), `st.matches` (statystyki sezonu).

---

## Przepływ danych — od Oracle do karty

```
Oracle /public-api/tips?date=
  → { matches: [{...info, predictions: [...]}] }
       │
       ▼  lib/oracle.ts:oracleFetch   (server-only, X-API-Key)
       │
       ▼  lib/tips.ts:hasTipsOrMatches  (bramka kontraktu)
       │
       ▼  lib/oracle-map.ts:adaptTips   ★ JEDYNE MIEJSCE PARSOWANIA
       │     spłaszcza {...match, ...prediction} → adaptTip
       │
       ▼  TipsResponse { date, tips: Tip[] }   ← kontrakt wewnętrzny
       │
       ├─→ app/page.tsx (landing)
       ├─→ app/typy/page.tsx → TypyPage → groupByMatch() → MatchTipCard
       ├─→ app/live/page.tsx → LiveView → MatchLiveCard
       └─→ app/api/tips/route.ts → fetch client-side (typy-page, my-picks)
```

**Wniosek architektoniczny:** adapter jest wąskim gardłem z premedytacją. Zmiana shape'u Oracle wymaga dotknięcia **1 pliku** (+ `sitemap.ts`, który świadomie omija adapter dla wydajności).

---

## Uwagi i potencjalne luki

### 1. Pola `market` i `pick` nie są dziś czytane

Nowe API deklaruje w predykcjach `market` i `pick`, ale `adaptTip` ich nie mapuje — używa `bet_type` / `bet_side` (też obecnych w nowym shape) i przepuszcza je przez `mapBetType` / `mapBetSide`, a etykiety generuje lokalnie `lib/market-label.ts:getMarketLabel()`.

**To działa**, dopóki Oracle wysyła `bet_type`/`bet_side`. Gdyby ich zabrakło i zostały tylko `market`/`pick`, wszystkie typy zmapują się na `"MIX"` (domyślka `mapBetType`). Warto rozważyć fallback `t.bet_type ?? t.market` — ale bez potwierdzenia z Oracle, jak dokładnie wygląda `market`, to zgadywanie.

### 2. Predykcje bez `is_primary`

`MatchTipCard` sortuje po `is_primary` + `q_score` i pokazuje 3 pierwsze z „+N więcej". Jeśli nowe API nie wysyła `is_primary_recommendation`, sortowanie zdegraduje się do czystego Q-Score — poprawne, ale traci sygnał „główna rekomendacja meczu".

### 3. Kompatybilność wsteczna jest realna, nie kosmetyczna

Fallback na `{ tips: [...] }` zostaje w kodzie celowo: gdyby Oracle wrócił do starego shape'u (rollback po stronie bota), front nie crashuje.
