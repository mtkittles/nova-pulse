# Generator danych demo — podsumowanie

**Repo:** `mtkittles/nova-pulse` · **PR:** [#70](https://github.com/mtkittles/nova-pulse/pull/70)
**Branch:** `claude/determined-galileo-1Vsu7` · **Commit:** `f174649` · **Data:** 2026-08-04
**Status:** ✅ `next build` exit 0 · smoke-test runtime przeszedł

---

## Zasada naczelna

Generator zwraca **dokładnie ten sam kształt** co Oracle po migracji:

```
{ date, count, matches: [{ ...match_info, predictions: [...] }] }
```

Dzięki temu dane demo przechodzą przez **ten sam adapter** (`adaptTips`) co produkcja.
Demo *testuje* migrację z PR #69, zamiast ją omijać.

Produkcyjny fetch z Oracle jest **nietknięty** — tryb demo to wyłącznie `early-return` przed nim.

---

## Pliki

| plik | rola |
|---|---|
| `lib/demo-tips.ts` (+560) | generator: PRNG, ligi, rynki, wyniki, sieroty |
| `lib/demo-flags.ts` | flagi (edge-safe — importuje je middleware) |
| `lib/demo-source.ts` | resolver server-side (`isDemoDataOn`) |
| `middleware.ts` | `?demo=1` → cookie `lb_demo` |
| `lib/tips.ts` | +3 early-returny |
| `lib/calendar.ts` | +1 early-return |

> `lib/demo-data.ts` to **co innego** (profil/kupony testera) — nietknięty.

---

## Zmierzone rozkłady (okno 7 dni)

| wymaganie | cel | zmierzone |
|---|---|---|
| liczba meczów | 40–60 | **50** |
| liczba lig | 12–15 | **14–16** (16 zdefiniowanych) |
| predykcje | — | 107 |
| mecze z 1 rynkiem | „część" | 21 |
| mecze z >3 rynkami (**„+N więcej"**) | „część" | 7 (~14%) |
| won / lost / void | 60 / 35 / 5 | **60,4 / 31,3 / 8,3** |
| Q-Score | 55–100, rozłożony | **57–100**, każdy decyl reprezentowany |
| kursy | 1.5–4.5 | **1.50–4.41** |
| confidence | 0.3–0.8 | **0.30–0.79** |
| sieroty | „kilka" | **4** |
| edge > 0 | — | 76% (istotne: filtr „Tylko value" jest domyślnie ON) |

**Uwaga do void:** parametr to 5% *na mecz*; zmierzone 8,3% to wariancja na próbie ~22 meczów rozegranych. Wartość nie jest „podkręcana" pod cel — okno przesuwa się z każdym dniem.

## Ligi (16)

Ekstraklasa 🇵🇱 · Premier League · Championship · La Liga · Bundesliga · Serie A · Ligue 1 · Eredivisie · Primeira Liga · Brasileirão Série A · Liga Profesional 🇦🇷 · Allsvenskan 🇸🇪 · Eliteserien 🇳🇴 · Superliga 🇩🇰 · Premiership 🏴 · Süper Lig 🇹🇷

Nazwy/kraje/flagi lig spoza statycznego słownika (`POL`, `DED`, `FL1`, `NOR`, `DEN`) wstrzykiwane przez istniejące `primeLeagueNames()` — **bez modyfikacji** `lib/leagues.ts`.

---

## Trzy decyzje projektowe warte uwagi

### 1. Wynik dobierany DO rynków, nie odwrotnie

Pierwsza wersja losowała wynik, potem ważyła wybór rynków „pod trafienie". Wyszło **49%**, nie 60%.

Przyczyna jest strukturalna: przy wyniku **1:0 wygrywa tylko 1 z 9** rozliczalnych rynków (samo „1"; BTTS, wszystkie Over i Team O1.5 przegrywają). Żadne ważenie wyboru rynku tego nie wyciągnie — mecze niskopunktowe ciągną średnią do ~50%.

`chooseScoreline()` odwraca kolejność: najpierw rynki, potem wynik ważony tak, by ~60% z nich trafiło — przy zachowaniu realistycznego rozkładu wyników (waga bazowa × dopasowanie⁴).

Efekt: **60,4%**.

### 2. `result` liczony realnym `resolveTip()`

Tą samą funkcją, której używa UI (`settleTip` → `resolveTip`). Odznaka na karcie **nigdy** nie rozjedzie się z polem `result`.

Konsekwencja: rynki, których `resolveTip` nie rozlicza (handicap → wpadłby w gałąź `bet_side === "home"` i został policzony jak Team O1.5), trafiają **wyłącznie na mecze bez wyniku**. Filtr HANDICAP na `/typy` ma więc treść, ale nigdy błędnie rozliczoną.

### 3. `confidence` wyprowadzana z kursu

`confidence = clamp(1/odds + target_edge, 0.3, 0.8)` zamiast niezależnego losowania.

Gdyby confidence i kurs były niezależne, edge (`model_prob − 1/odds`) byłby przypadkowy — a filtr **„Tylko value" (`edge > 0`) jest na `/typy` domyślnie włączony**, więc demo świeciłoby pustkami. Przy sprzężeniu ~76% typów ma dodatni edge.

---

## Przełącznik

| mechanizm | zasięg |
|---|---|
| `DEMO_DATA=true` (env) | wszystkie żądania — ustaw w scope **Preview** na Vercel |
| `?demo=1` | cookie `lb_demo` (8 h), `?demo=0` wyłącza |

Cookie jest **konieczne**, a nie wygodą: `/typy` i `/kupony` fetchują `/api/tips` **client-side** przy zmianie daty. Bez cookie pierwszy render byłby demo, a każde kliknięcie w datę wracałoby po dane do Oracle.

### Zabezpieczenie produkcji

Na produkcji `?demo=1` wymaga jawnego `ALLOW_DEMO_PARAM=true`. Bez tego ktokolwiek mógłby dopisać parametr do linku żywego serwisu i zobaczyć **zmyślone typy jako prawdziwe** — na serwisie z predykcjami bukmacherskimi to realne ryzyko wprowadzenia w błąd.

Zweryfikowane runtime: bez flagi parametr jest ignorowany, a **ręcznie podrzucone cookie też nie przechodzi** (`isDemoDataOn` sprawdza flagę niezależnie od cookie — obrona w głąb).

### Zmienne środowiskowe (nowe)

| zmienna | domyślnie | opis |
|---|---|---|
| `DEMO_DATA` | — | `true` → dane demo dla wszystkich żądań |
| `ALLOW_DEMO_PARAM` | auto | `true` → `?demo=1` działa też na produkcji; poza produkcją włączone samo |

Brak sekretów. Obie server-side (bez `NEXT_PUBLIC_`).

---

## Weryfikacja

**Build:** `next build` exit 0, middleware 34,2 kB.

**Runtime** (`next start`):

| test | wynik |
|---|---|
| `?demo=1` → `Set-Cookie: lb_demo=1` | ✅ |
| `/api/tips` z cookie → dane demo (Ekstraklasa, herby, `leagueCode: POL`) | ✅ |
| `/api/tips` bez cookie → mock (ścieżka produkcyjna) | ✅ |
| produkcja bez `ALLOW_DEMO_PARAM` → param ignorowany | ✅ |
| produkcja + podrzucone cookie → demo nadal OFF | ✅ |

---

## Znane ograniczenie

Linki `/mecz/{event_id}` z kart demo prowadzą do „nie znaleziono meczu" — `getMatchDetailed()` nadal idzie do Oracle. Sieroty są zgate'owane (renderują się bez linku), ale **zwykłe mecze demo nie**.

Rozszerzenie: analogiczny early-return w `lib/match.ts` + generator szczegółów meczu (H2H, forma, rozkład wyników, macierz). Poza zakresem tego zadania — do decyzji, czy potrzebne.

---

## Do sprawdzenia w preview

1. `?demo=1` → `/typy`: 13–22 typów, filtr „Tylko value" niepusty, karta z >3 rynkami pokazuje „+N więcej".
2. `/live`: sekcja „Na żywo" ma mecze (2 wymuszone w oknie live niezależnie od pory dnia).
3. Sierota: karta wyszarzona, inicjały zamiast herbu, brak linku.
4. Zmiana daty na `/typy` (client-side fetch) nadal zwraca demo.
5. `?demo=0` → powrót do danych Oracle.
