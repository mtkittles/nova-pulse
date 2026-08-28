# Podsumowanie — UI vs wersjonowanie modelu w `/public-api/stats`

**Branch:** `claude/determined-galileo-1Vsu7` · **PR:** [#70](https://github.com/mtkittles/nova-pulse/pull/70) (draft)
**Commit:** `bbe1395` — „Dostosuj UI do wersjonowania modelu w /public-api/stats"

## Kontekst

Backend Oracle naprawił `/public-api/stats` (wcześniej cichy błąd SQL, zawsze
HTTP 200 z pustymi danymi) i dodał wersjonowanie modelu: domyślnie endpoint
zwraca tylko typy **bieżącej wersji** (v1, od 10 sierpnia 2026) — starsze typy
odfiltrowane, bo pochodziły z niedziałającego modelu. Nowy parametr
`?include_legacy=true` dociąga pełną historię. W okresie przejściowym (dopóki
pierwsze typy v1 się nie rozliczą) `total=0`.

Zadanie: dostosować UI tak, żeby `total=0` nigdy nie renderowało się jako
„0% skuteczności" ani błąd — tylko informatywny komunikat, z opcją podejrzenia
starszej historii.

## Zmiany

| Plik | Zmiana |
|---|---|
| `lib/stats.ts` | `getStats(period?, includeLegacy?)` — nowy opcjonalny parametr, doklejany jako `?include_legacy=true` do zapytania do Oracle |
| `app/api/stats/route.ts` | Route handler czyta `include_legacy` z query string i przekazuje dalej do `getStats()` |
| `components/stats-screen.tsx` | **[A] Pusty stan (`total_tips=0`, bez legacy):** tytuł „Model w nowej wersji zbiera dane" + treść „Model w nowej wersji zbiera dane od 10 sierpnia. Pierwsze rozliczone typy pojawią się po najbliższych meczach." + CTA „Pokaż pełną historię (starsza wersja modelu)" → client-side fetch `/api/stats?include_legacy=true`. **[B] Baner przy aktywnej historii:** pomarańczowy pasek nad treścią — „Pokazujesz pełną historię, łącznie ze starszą wersją modelu — te wyniki nie odzwierciedlają obecnej jakości typowania." + link powrotu „Wróć do aktualnej wersji". Przełącznik okresu (7D/30D/…) zachowuje wybrany tryb legacy. |
| `components/landing/baseline-comparison.tsx` | Nowy prop `hasData?: boolean` (domyślnie `true`). Gdy `false` — zamiast trzech słupków (rzut monetą / średnia bukmacherska / model **0.0%**) karta pokazuje wyłącznie nagłówek + zdanie: „Model w nowej wersji zbiera dane od 10 sierpnia — porównanie… pojawi się po pierwszych rozliczonych typach." |
| `components/landing/model-form-chart.tsx` | Istniejący fallback pustego wykresu (`timeline.length === 0`) — treść zamieniona z generycznego „Brak danych historycznych" na to samo zdanie o wersji modelu |
| `components/landing/mini-terminal.tsx` | **Znaleziony przy okazji bug**: linia „skuteczność 30 dni: X%" w `buildFacts()` renderowała się zawsze, niezależnie od danych — przy `total_tips=0` pokazywała dokładnie to, czego zadanie miało unikać: „skuteczność 30 dni: **0.0%**". Nowy prop `hasStatsData` pomija tę linię, gdy brak rozliczonych typów. |
| `components/landing-page.tsx` | Doprowadzenie `totalTips` (już było w typie, nieużywane) → `hasStatsData = totalTips > 0` → przekazane do `BaselineComparison` i `MiniTerminal` |

## Weryfikacja

- `npx tsc --noEmit` — czysto.
- `next build` — czysto (14/14 stron).
- **Playwright, 390px i 1440px**, serwer `next start` podpięty pod lokalny mock
  Oracle (symulujący realny kontrakt: `total=0` domyślnie, pełne dane pod
  `include_legacy=true`):
  - `/stats` bez danych → poprawny tytuł + opis + CTA (zrzut `01`).
  - klik CTA → dane się doładowują, baner „Pokazujesz pełną historię…"
    widoczny, liczby realne (61.1%, +18.2% ROI itd.) (zrzut `02`).
  - klik „Wróć do aktualnej wersji" → powrót do pustego stanu.
  - landing „Forma modelu" i „Model vs punkt odniesienia" → oba pokazują
    komunikat zamiast pustego wykresu / 0.0% (zrzut `04`).
  - mini-terminal „Dziś w piłce" → **potwierdzone brakiem** linii
    „skuteczność 30 dni: 0.0%" po naprawie (przed naprawą pierwszy przebieg
    testu złapał to jako regresję).
  - Żadna sekcja nie została usunięta — wszystkie zostają widoczne z
    komunikatem zamiast danych, zgodnie z wymaganiem.

## Podgląd (Vercel, PR #70)

https://nova-pulse-git-claude-determined-gali-78b1a7-mtkittles-projects.vercel.app/

(build startuje po pushu — status widoczny w komentarzu Vercela na PR)

## Bez zmian env / sekretów

Brak nowych zmiennych środowiskowych. `include_legacy` to zwykły parametr
zapytania przekazywany server-side do Oracle — nie dotyka `ORACLE_API_URL`
ani `ORACLE_API_KEY`.
