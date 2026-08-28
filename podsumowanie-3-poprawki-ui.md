# Podsumowanie — 3 poprawki UI (produkcja)

**Branch:** `claude/determined-galileo-1Vsu7` · **PR:** [#70](https://github.com/mtkittles/nova-pulse/pull/70) (draft)
**Commit:** `67d5cb7` — „Napraw 3 błędy UI produkcyjne: łamanie nazw drużyn, ucięty terminal, podpis demo"

## 1. Łamanie nazw drużyn na /mecz/{id} (390px)

**Prawdziwa przyczyna** (nie ta, którą podejrzewałem na starcie): `match-detail.tsx`
dokładał własny `px-4` na wrapperze, mimo że strona jest już opakowana w
`AppShell`, który ma `px-[clamp(1.5rem,5vw,5rem)]`. Podwójny padding zjadał
**80px** szerokości na 390px viewport — kolumny drużyn miały tylko 99px
zamiast 115px. Wszystkie inne strony w `AppShell` (np. `/stats`) NIE dokładają
własnego paddingu — `match-detail.tsx` był tu wyjątkiem.

| Plik | Zmiana |
|---|---|
| `components/match-detail.tsx:155` | usunięto redundantny `px-4` z wrappera |
| `components/match-detail.tsx:174-195` | `-mx-2` bleed na siatce, `gap-2`→`sm:gap-3`, kolumna czasu ograniczona do `max-w-[88px]`, `w-full` na kolumnach drużyn (zamiast `max-w-full`, które nie działało na flex-item z `items-center`), `text-wrap:balance`, `text-sm`→`sm:text-base` |

**Weryfikacja (Playwright, 390px, wstrzyknięte długie nazwy):**
- „Sportivo Trinidense" / „1. FC Union Berlin" — czysty łam na granicy wyrazu, 2 linie.
- „IF Brommapojkarna" / „Borussia Mönchengladbach" — pierwsze słowo się mieści,
  drugie (14-15 znaków, jeden token) i tak nie zmieści się w ~115px kolumnie
  przy dowolnym paddingu → poprawny fallback: `line-clamp-2` + ellipsis
  („Brommapojkar…", „Mönchenglad…"), **bez** brzydkiego łamania w środku bez
  wskaźnika (dawne „Siri / us").

## 2. Terminal „Dziś w piłce" — wyglądał na ucięty

**Przyczyna** (potwierdzona pomiarem `scrollWidth`/`clientWidth` w Playwright,
NIE bug w logice JS — typewriter kończył i zapętlał się poprawnie w 20s
teście): klasa `truncate` (CSS `text-overflow:ellipsis; overflow:hidden`)
przycinała wizualnie długie linie faktów (np. z długimi nazwami drużyn),
łącznie z migającym kursorem tuż po nich — stąd wrażenie „zawieszonej"
animacji.

| Plik | Zmiana |
|---|---|
| `components/landing/mini-terminal.tsx` | dodano `MAX_LINE_CHARS = 36` + `capLine()` — każda linia z `buildFacts()` jest teraz cięta z własnym wielokropkiem, zanim trafi do `truncate`d kontenera |

**Weryfikacja:** wszystkie 6 linii wypisuje się w pętli bez `scrollWidth > clientWidth`
(brak wizualnego obcięcia) — potwierdzone programowo i zrzutem ekranu.

## 3. Podpis „dane demo" na produkcji

Podpis pod wynikiem modelu w sekcji „Model vs punkt odniesienia" był
zahardkodowany na „realna skuteczność, dane demo" niezależnie od trybu.

| Plik | Zmiana |
|---|---|
| `app/page.tsx` | doliczono `isDemoDataOn()` do równoległego `Promise.all`, przekazane jako `isDemo` do `<LandingPage>` |
| `components/landing-page.tsx` | nowy prop `isDemo?: boolean`, przekazywany do `<BaselineComparison>` |
| `components/landing/baseline-comparison.tsx` | `note` wiersza modelu i zdanie metodologii warunkowe: demo → „…dane demo" / „…w trybie demonstracyjnym", produkcja → „dane z rozliczonych typów" / bez wzmianki o demo |

**Sprawdzone też:** grep całego repo pod kątem innych zahardkodowanych
wzmianek o „demo" — pozostałe (baner w `layout.tsx`, błędy `demo_disabled`
w API komentarzy) są już poprawnie zagate'owane (`DEMO_MODE` / porównanie
`session.uid === DEMO_USER.id`). `baseline-comparison.tsx` był jedynym
miejscem z tym błędem.

**Weryfikacja:** tryb demo (`?demo=1` + cookie) → „dane demo"; żądanie bez
cookie/param → „dane z rozliczonych typów" (potwierdzone Playwright).

## Build i testy

- `npx tsc --noEmit` — czysto.
- `next build` — czysto (14/14 stron, brak błędów/warningów).
- Playwright, viewport 390×844: wszystkie trzy poprawki zweryfikowane
  bezpośrednim pomiarem DOM (nie tylko wizualnie) + zrzutami ekranu.

## Podgląd (Vercel, PR #70, po pushu — build w toku w momencie pisania)

https://nova-pulse-git-claude-determined-gali-78b1a7-mtkittles-projects.vercel.app/?demo=1

## Bez zmian env / sekretów

Brak nowych zmiennych środowiskowych — wszystkie trzy poprawki to zmiany
czysto frontendowe (CSS/layout + jeden nowy boolean prop przekazywany
server→client).
