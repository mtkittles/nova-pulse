# API tips — migracja shape `{ matches: [...] }` — podsumowanie

**Repo:** `mtkittles/nova-pulse` · **PR:** [#69](https://github.com/mtkittles/nova-pulse/pull/69) (draft)
**Branch:** `claude/determined-galileo-1Vsu7` · **Data:** 2026-08-03
**Status:** ✅ `next build` exit 0 · Vercel Preview **Ready** · Preview Comments check **success**
**Preview:** https://nova-pulse-git-claude-determined-gali-78b1a7-mtkittles-projects.vercel.app

---

## Zakres

Oracle zmienił kształt odpowiedzi tips:

- **STARY:** `{ tips: [{event_id, home_team, away_team, market, pick, odds, q_score, …}] }` — płaska, jeden wpis per typ.
- **NOWY:** `{ matches: [{...match_info, predictions: [{market, pick, bet_type, bet_side, odds, q_score, confidence, result}]}] }` — grupowane po meczu.

## Podejście — minimalna, izolowana zmiana

Zmiana skupiona **w adapterze** (`lib/oracle-map.ts`). Wewnętrznie zachowujemy `TipsResponse = { date, tips: Tip[] }`, bo `MatchTipCard` już grupuje po `event_id` przez `groupByMatch(tips)` — więc downstream (typy-page, live-view, mecz-tabs, my-picks, stats, sitemap) **bez zmian w kontrakcie**.

Adapter przyjmuje **oba kształty** — nowy detekcyjnie (`Array.isArray(r.matches)`), stary jako fallback (`Array.isArray(r.tips)`). Kompatybilność wstecz zachowana.

## Zmiany plikowe (6 plików, +71/−18)

### Adapter (kluczowe)
- **`lib/oracle-map.ts`**
  - `adaptTips`: gdy `matches[]`, iteruje po meczach, spłaszcza `predictions[]` łącząc `match_info` z każdą predykcją (`{...mo, ...po}`), potem `adaptTip`.
  - `adaptTip.model_prob`: fallback na `t.confidence` (nowy shape używa `confidence` zamiast `model_prob`).
  - `mapResult`: fallback na `t.result` (nowy shape używa `result` zamiast `actual_result`).
  - Sierotę wykrywa wciąż raz w `adaptTip` (`kickoff_utc == null && match_status == null`). Po spłaszczeniu w nowym shape każda predykcja dziedziczy match-info z `mo` — mechanika bez zmian.

### Fetch + SEO
- **`lib/tips.ts`** — `hasTipsArray` → `hasTipsOrMatches`: akceptuje `tips[]` LUB `matches[]`. Bramka przed `adaptTips`.
- **`app/sitemap.ts`** — `/public-api/tips/history` czyta `data.matches ?? data.tips` (event_id → `/mecz/{id}`).

### UI
- **`components/match-tip-card.tsx`**
  - Gdy mecz ma **> 3 rynków**, pokazujemy 3 top (posortowane `is_primary` + Q-Score) + **przycisk „+N więcej"** / „Zwiń" z chevron.
  - Sieroty **wyszarzone** (`opacity-70 saturate-.6`) — dodane do `cardClass`.
- **`components/tip-card.tsx`** — sieroty wyszarzone (jw.).
- **`components/match-live-card.tsx`** — sieroty wyszarzone + **gate linka** `/mecz/{id}` gdy `isOrphan`.

## Zasady utrzymane

- **Nie dotknięte:** komponenty wykresów (Recharts), filtry `/typy` (kategorie market), design system tokens (Graphite Night `--bg-0 #05070B`, `--cyan #58E6F5`), `TeamBadge` (initials fallback dla brakujących herbów).
- Sesja/Oracle-key server-side bez zmian. Brak nowych env vars.
- `null → "—"` (Sprint 1) zachowane.
- Kompatybilność wstecz: gdyby Oracle chwilowo wrócił do `{ tips: [...] }` — front nie crashuje (fallback w `adaptTips`).

## Statystyki diffu

- **6 plików**, **+71 / −18** (netto +53). Cała zmiana w adapterze + UI trim.

## Weryfikacja

- ✅ `next build` — exit 0, wszystkie route'y (`/typy 16.7 kB`, `/live 5.65 kB`, `/mecz/[id] 13.2 kB`, `/sitemap.xml`) kompilują się bez błędów/warningów.
- ✅ Vercel Preview: deployment **Ready**.
- ✅ Vercel Preview Comments check: **success**.
- ⏳ Wizualna weryfikacja w preview: `/typy`, landing „Dziś", `/live`, sierota.

## Zasięg stron

`app/page.tsx` (landing), `/typy`, `/live`, `/sitemap.xml`. Endpoint proxy `/api/tips`, `/api/tips/today` zwraca `TipsResponse` (adapter output — bez zmian w kontrakcie zewnętrznym).
