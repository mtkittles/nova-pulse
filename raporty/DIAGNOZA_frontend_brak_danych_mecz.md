# Diagnoza — puste zakładki na /mecz/{id} mimo poprawnych danych z Oracle

**Przykład:** `af_1490402` (Real Salt Lake vs FC Dallas, MLS, 20.08.2026)
**Środowisko testowe:** preview Vercel PR #70 (`nova-pulse-git-claude-determined-gali-78b1a7-mtkittles-projects.vercel.app`)

## TL;DR

To **nie jest** problem z kluczem API, z URL-em ani z formatem `event_id` — te trzy
rzeczy działają poprawnie. Backend zmienił kształt JSON-a zwracanego przez
`/match/{id}/detailed` (nowe, zagnieżdżone pola: `home_team_id`/`away_team_id`
na najwyższym poziomie, `h2h` jako obiekt z polem `.matches` zamiast płaskiej
tablicy, brak osobnego kodu ligi — tylko pełna nazwa w `match.league`), a
`adaptMatchDetailed()` w `lib/oracle-map.ts` wciąż mapuje pod **stare** klucze.
Efekt: trzy niezależne pola w zaadaptowanym obiekcie wychodzą puste/`null`,
mimo że surowe dane z Oracle są kompletne.

## Punkt 1 — gdzie frontend woła match detailed

Server-side, przez Route Handler? Nie — bezpośrednio z **Server Component**
(`app/mecz/[id]/page.tsx:54`) wołającym `getMatchDetailed(id)` z
`lib/match.ts:112-133`, które robi `oracleFetch(`/match/${id}/detailed`)`
(`lib/oracle.ts:33-54`). Żaden fetch nie leci z przeglądarki — zgodnie z
zasadą z `CLAUDE.md` (Oracle nie jest wystawiony do przeglądarki).

## Punkt 2 — X-API-Key

Wysyłany poprawnie: `oracleFetch()` dokłada `headers: { "X-API-Key": key }`
(`lib/oracle.ts:45-48`), `key = process.env.ORACLE_API_KEY` — server-only,
nigdy nie trafia do bundla klienta. **Potwierdzone empirycznie**: gdyby klucz
był zły/brakujący, curl w punkcie 4 dostałby 401/403, a dostał 200 z pełnymi
danymi.

## Punkt 3 — URL i format event_id

`/match/${encodeURIComponent(id)}/detailed` z `id = "af_1490402"` (z prefiksem
`af_`, dokładnie jak w linku). **To też nie jest przyczyna** — odpowiedź
Oracle (punkt 4) ma `"event_id":"af_1490402","found":true`, więc endpoint
poprawnie rozpoznaje mecz w tym formacie.

## Punkt 4 — realna odpowiedź Oracle (rozstrzygające)

Żeby to sprawdzić bez zgadywania, dodano tymczasowy endpoint diagnostyczny
`app/api/debug/match-raw/[id]/route.ts`, który woła `oracleFetch()` (ten sam
kod co produkcja) i zwraca **surowy** JSON bez adaptera. Wdrożony na preview
PR #70, odpytany bezpośrednio:

```
curl -sS ".../api/debug/match-raw/af_1490402"
→ HTTP 200
```

Pełne body (sformatowane dla czytelności):

```json
{
  "detailed": {
    "event_id": "af_1490402",
    "found": true,
    "home_team_id": 8193,
    "away_team_id": 8201,
    "match": {
      "home_team": "Real Salt Lake",
      "away_team": "FC Dallas",
      "league": "Major League Soccer",
      "country": "USA",
      "date": "2026-08-20 01:30:00.000000",
      "status": "SCHEDULED",
      "score": null
    },
    "form": {
      "home": { "last5": "DDLLD", "last10": "DDLLDWWLWW", "team_id": 8193, "team_name": "Real Salt Lake" },
      "away": { "last5": "WDDLD", "last10": "WDDLDWWLWW", "team_id": 8201, "team_name": "FC Dallas" }
    },
    "h2h": {
      "count": 5,
      "btts_pct": 0.8,
      "over_1_5_pct": 0.8,
      "score_distribution": { "3-1": 1, "1-1": 1, "0-1": 1, "3-2": 1, "3-3": 1 },
      "matches": [
        { "home_team": "FC Dallas", "away_team": "Real Salt Lake", "home_score": 3, "away_score": 1, "date": "2026-05-10", "btts": true, "over_1_5": true, "over_2_5": true },
        { "home_team": "FC Dallas", "away_team": "Real Salt Lake", "home_score": 1, "away_score": 1, "date": "2025-05-11", "btts": true, "over_1_5": true, "over_2_5": false },
        { "home_team": "Real Salt Lake", "away_team": "FC Dallas", "home_score": 0, "away_score": 1, "date": "2025-03-23", "btts": false, "over_1_5": false, "over_2_5": false },
        { "home_team": "Real Salt Lake", "away_team": "FC Dallas", "home_score": 3, "away_score": 2, "date": "2024-09-19", "btts": true, "over_1_5": true, "over_2_5": true },
        { "home_team": "FC Dallas", "away_team": "Real Salt Lake", "home_score": 3, "away_score": 3, "date": "2024-05-26", "btts": true, "over_1_5": true, "over_2_5": true }
      ]
    },
    "scorers": { "home": [], "away": [{ "name": "P. Musa", "goals": 13, "assists": 2, "position": "Forward" }] },
    "predictions": [{ "bet_type": "BTTS", "bet_side": "", "market_label": "BTTS", "model_prob": 0.662, "odds": 1.74, "edge": 0.1272, "q_score": 85, "mode": "loose", "status": "pending" }],
    "score_matrix": null
  }
}
```

**Wniosek punktu 4:** to jest opcja "200 z danymi, które giną w parsowaniu" —
nie 401, nie 404. `found: true`, forma 10/10 obu drużyn, H2H z 5 meczami —
wszystko obecne w surowej odpowiedzi.

## Punkt 5 — gdzie dane giną (3 niezależne bugi w `adaptMatchDetailed`)

Wszystkie trzy w `lib/oracle-map.ts`, funkcja `adaptMatchDetailed()`
(linie 885–961). Adapter zakłada **stary, płaski** kształt Oracle; nowy
kształt (widoczny w punkcie 4) go łamie w trzech miejscach:

| # | Zakładka / objaw | Kod (stary, zły) | Realny kształt Oracle | Skutek |
|---|---|---|---|---|
| A | „Forma — ostatnie mecze" → **Brak danych o formie tej drużyny.** | `lib/oracle-map.ts:926-927`<br>`home_id: pickId(m, ["home_id","home_team_id","homeId"])` — czyta z `m` (=`r.match`) | `home_team_id`/`away_team_id` są na **najwyższym poziomie** `r`, nie w `r.match` | `m.home_team_id` nie istnieje → `home_id = null` → `FormPanel` (`components/form-panel.tsx:79,86-87,107-108`) dostaje `teamId=null` → renderuje pustą treść zamiast odpytać `/api/team/8193/form` |
| B | „Tabela ligowa" → **Brak tabeli ligowej.** | `lib/oracle-map.ts:919`<br>`leagueCode: String(m.league_code ?? r.league_code ?? m.league ?? "")` | Oracle nie zwraca żadnego `league_code` — jedyne pole to `match.league = "Major League Soccer"` (pełna nazwa, nie kod) | `leagueCode` zostaje ustawiony na pełną nazwę zamiast kodu (`"MLS"`). `StandingsTable` (`components/standings-table.tsx:30`) woła `/api/league/Major%20League%20Soccer/standings` → Oracle nie rozpoznaje tej „ligi" → pusta tabela. Dodatkowo w `app/mecz/[id]/page.tsx:35` `match.leagueCode \|\| leagueCodeByName(...)` — skoro `leagueCode` jest już (błędnie) niepuste, poprawny fallback `leagueCodeByName("Major League Soccer") → "MLS"` (`lib/leagues.ts:64-67`, mapa zawiera ten wpis!) **nigdy się nie wykonuje** |
| C | „H2H" → **Brak historycznych spotkań.** | `lib/oracle-map.ts:898`<br>`rawH2h = Array.isArray(r.h2h) ? r.h2h : Array.isArray(m.h2h) ? m.h2h : []` | `r.h2h` to **obiekt** `{count, btts_pct, over_1_5_pct, score_distribution, matches: [...]}`, nie tablica — realna lista jest pod `r.h2h.matches` | `Array.isArray(r.h2h)` = `false` (to obiekt) → `rawH2h = []` → `h2h_matches.length === 0` → zakładka H2H i pigułka licznika (`MeczTabs h2hCount=...`, `match-detail.tsx:243,420-421`) pokazują pusty stan mimo 5 realnych meczów w payloadzie |

**Efekt uboczny (nieszkodliwy, do wiedzy):** `home_metrics`/`away_metrics`
(`lib/oracle-map.ts:930-931`, czytają `r.home_stats`/`m.home_stats` — pól tych
też już nie ma, zastąpione przez `form.home`/`form.away` w nowym kształcie)
wychodzą `null`. Nie widać tego jako bug, bo w produkcji te pola są używane
wyłącznie w sekcji `TeamStrength`, zabramkowanej przez `match.lambda_home != null`
(`components/match-detail.tsx:213`) — pole które Oracle i tak nigdy nie
zwraca dla prawdziwych meczów (tylko w danych demo), więc ta sekcja i tak się
nie renderuje. Podobnie `home_scorers`/`away_scorers` (czytane z nieistniejących
`r.home_scorers`) wychodzą puste, mimo że nowy kształt ma dane w `scorers.home`/`scorers.away`
— to wpływa na `TopScorers`, ale nie było zgłoszone jako objaw w tym zadaniu.

## Podsumowanie przyczyny źródłowej

Backend Oracle zmienił kontrakt `/match/{id}/detailed` (prawdopodobnie przy
tej samej migracji co `/public-api/stats` z poprzedniego zadania) na nowy,
bardziej zagnieżdżony kształt — ale `adaptMatchDetailed()` w
`lib/oracle-map.ts` nie został zaktualizowany pod te trzy pola. To nie jest
problem sieci, autoryzacji, routingu ani React-a — to czysto mapowanie
JSON→wewnętrzny typ w jednym pliku, trzy niezależne, punktowe poprawki:

1. `home_id`/`away_id` — dołożyć `pickId(r, [...])` obok `pickId(m, [...])`.
2. `leagueCode` — gdy brak realnego kodu, użyć `leagueCodeByName(m.league)`
   zamiast surowej nazwy jako fallbacku (mapa już to obsługuje —
   `"major league soccer" → "MLS"`).
3. `h2h_matches` — czytać `r.h2h.matches` (i `r.h2h.count`/`btts_pct` jeśli
   przyda się gdzieś indziej), nie zakładać że `r.h2h` samo jest tablicą.

## Sprzątanie

Tymczasowy endpoint `app/api/debug/match-raw/[id]/route.ts` (użyty wyłącznie
do zdobycia surowej odpowiedzi w punkcie 4) zostanie usunięty w tym samym
commicie co ten raport — nie jest częścią produkcyjnego kodu.

## Zakres tego zadania

To była wyłącznie **diagnoza** (zgodnie z poleceniem) — bugi A/B/C w
`lib/oracle-map.ts` **nie zostały jeszcze naprawione** w kodzie. Trzy
konkretne, gotowe do wdrożenia poprawki są opisane wyżej i czekają na
osobne zlecenie naprawy.
