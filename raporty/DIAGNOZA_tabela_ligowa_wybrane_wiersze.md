# Diagnoza — tabela ligowa pokazuje tylko wybrane wiersze (np. #1, #6, #11, #15)

**Status:** diagnoza wstępna, kod **nie został zmieniony** — czekam na dane
do domknięcia (patrz „Czego mi brakuje” niżej).
**Zgłoszony objaw:** zakładka „Liga" na `/mecz/{id}` → tabela ligowa
pokazuje tylko pojedyncze, rozstrzelone wiersze (np. #1, #6, #11, #15)
zamiast pełnej tabeli lub sensownego okna wokół drużyny meczu.

## Punkt 1 — gdzie jest komponent

Sekcja „Tabela ligowa" (zakładka „Liga" na `/mecz/{id}`) renderuje
`StandingsTable` z **`components/standings-table.tsx`**, wpięty w
`components/match-detail.tsx:404`:
```tsx
<StandingsTable leagueCode={match.leagueCode} homeName={match.home} awayName={match.away} />
```

Jest jeszcze druga, **osobna** tabela ligowa — w `components/ligi-view.tsx`
(strona `/ligi`) — ale to inny komponent, inny plik, i renderuje **całą**
tablicę bez żadnego cięcia (`standings.map(...)`, `ligi-view.tsx:200`). Nie
jest kandydatem na ten bug, bo dotyczy innej strony niż ta zgłoszona.

## Punkt 2 — dane z API czy logika frontu?

`StandingsTable` (`standings-table.tsx:27-50`) robi:
1. `fetch(/api/league/{leagueCode}/standings)` → route handler
   (`app/api/league/[code]/standings/route.ts`) → `getStandingsWithMeta(code)`
   → `adaptStandings(data)` w `lib/oracle-map.ts:505-521`. **Żadnego cięcia
   w adapterze** — mapuje 1:1, tyle wierszy ile przyszło z Oracle.
2. Front-end **dedup** po znormalizowanej nazwie drużyny (zostaw pierwszy
   rekord) — `standings-table.tsx:36-42`.
3. Render: **`rows.slice(0, 20)`** (`standings-table.tsx:89`) — twardy limit
   pierwszych 20 wierszy, **nie** algorytm typu „co N-ty wiersz".

### Test na realnych danych (MLS, ten sam mecz co poprzednio — af_1490402)

Podstawiłem dokładnie ten JSON, który wcześniej odpytałeś bezpośrednio
(`/api/league/MLS/standings`, 29 wierszy — MLS ma dwie konferencje, stąd
zdublowane numery pozycji, np. dwie różne drużyny na #1, dwie na #2, itd.)
przez `dedup + slice(0, 20)`:

| Wynik | Oczekiwanie z symptomu | Zgodność |
|---|---|---|
| `slice(0, 20)` → pozycje **1–11** (z remisami konferencji), bez dziur | „tylko #1, #6, #11, #15" | ❌ **nie zgadza się** |

Deduplikacja niczego nie usuwa (wszystkie 29 nazw drużyn są unikalne), więc
żaden z dwóch mechanizmów frontu (dedup, slice(0,20)) matematycznie nie
produkuje rozstrzelonego wzorca „#1, #6, #11, #15" — dla **tych** danych
(MLS) kod zwróciłby wiersze #1 do #11 w komplecie, bez przeskoków.

## Wniosek (na tym etapie)

**Nie udało mi się odtworzyć zgłoszonego objawu z kodu, jaki jest w
repo, na danych, jakie mam** (realny payload MLS). To zawęża możliwe
przyczyny do jednej z trzech:

| # | Hipoteza | Gdzie szukać dalej |
|---|---|---|
| 1 | **Inna liga** niż MLS ma naprawdę rzadkie dane z samego Oracle (backend zwraca tylko te 4 wiersze) — front tylko wiernie je renderuje | surowa odpowiedź `/api/league/{KOD}/standings` dla tej konkretnej ligi |
| 2 | Zobaczone na **innym/starszym deployu** (np. sprzed fixu leagueCode z poprzedniego zadania) | który URL/build dokładnie, czy to preview PR #70 |
| 3 | **Kontener przewijalny**, nie prawdziwa utrata danych: `standings-table.tsx:75` ma `max-h-[28rem] overflow-y-auto` — widoczne bez scrolla to ~8-10 wierszy; mogło to zostać odebrane jako "tylko te wiersze istnieją" | czy próbowano scrollować w środku tabeli |

## Czego mi brakuje, żeby dokończyć diagnozę

Potrzebuję jednego z:
- nazwy/kodu ligi (i idealnie meczu), na której widziałeś ten dokładny
  objaw, + surowa odpowiedź `/api/league/{KOD}/standings` dla niej (tak
  jak poprzednio dla MLS), **albo**
- potwierdzenia, że to jednak MLS/`af_1490402` i że próbowałeś scrollować
  w kontenerze tabeli, zanim uznałeś że wierszy brakuje.

## Zakres tego zadania

Wyłącznie diagnoza — **żaden plik nie został zmieniony**. Propozycja
fixu (z pełnym diffem) dopiero po Twojej akceptacji diagnozy, zgodnie z
poleceniem.
