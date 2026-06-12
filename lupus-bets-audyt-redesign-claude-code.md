# LUPUS BETS — audyt strony produkcyjnej i plan pełnego redesignu

**Data audytu:** 12 czerwca 2026, ok. 02:20 czasu Europe/Warsaw  
**Audytowany deployment:** `https://nova-pulse-sage.vercel.app/`  
**Główna zakładka typów:** `https://nova-pulse-sage.vercel.app/typy`  
**Kontekst projektu:** frontend na Vercel, bot i logika predykcyjna na Oracle, repozytorium GitHub `lupus-bot`, dane piłkarskie z API-Sports / API-Football, logowanie przez Telegram.

---

## 1. Cel dokumentu

Dokument ma posłużyć jako specyfikacja pracy dla Claude Code. Zakres obejmuje:

1. audyt publicznie dostępnego wdrożenia,
2. wykryte błędy danych i niespójności UX,
3. docelową architekturę informacji,
4. kompletną koncepcję wizualną,
5. specyfikację komponentów,
6. plan poprawy integracji danych live,
7. checklistę testów akceptacyjnych,
8. kolejność wdrażania zmian bez destabilizacji działającego bota.

### Ważne ograniczenie audytu

Audyt został wykonany na podstawie publicznie wyrenderowanej wersji produkcyjnej i dostępnej treści podstron. Nie wykonano jeszcze audytu kodu źródłowego repozytorium ani bazy danych. Wnioski dotyczące przyczyn technicznych są hipotezami do zweryfikowania w kodzie. Nie należy zmieniać starego serwera Oracle ani produkcyjnego bota przed utworzeniem osobnej gałęzi roboczej, backupu i lokalnego środowiska testowego.

---

# 2. Najważniejszy wniosek

LUPUS BETS ma dobry fundament produktu: własny silnik predykcyjny, Telegram, Q-Score, typy BTTS i Team Over 1.5, tryb Mundialu, kupony oraz statystyki skuteczności. Obecna wersja wygląda jednak jak rozbudowane MVP, w którym jednocześnie występują:

- niespójności czasu i dat,
- nieaktualne dane na stronie głównej,
- błędna lub niejednoznaczna prezentacja rynku Team Over 1.5,
- duplikaty typów,
- surowe kody lig,
- puste sekcje i atrapowe dane Mundialu,
- niespójna polityka dostępu bez logowania,
- zbyt mało wizualnego „dowodu jakości” modelu.

Najpierw należy naprawić prawdziwość i spójność danych. Dopiero potem wykonywać pełny redesign. Piękny interfejs z błędnymi godzinami lub starymi typami osłabi zaufanie bardziej niż prostszy, ale poprawny dashboard.

---

# 3. Sprawdzone podstrony produkcyjne

| Podstrona | URL | Stan publicznego renderu |
|---|---|---|
| Landing page | `/` | działa, ale zawiera nieaktualne dane i sekcję Mundialu w stanie przedstartowym |
| Typy | `/typy` | działa, kalendarz i filtry widoczne; widoczne duplikaty i niespójność czasu |
| Mundial | `/mundial` | działa, ale część danych jest niespójna |
| Grupy Mundialu | `/mundial/grupy` | działa, lecz tabela nie odzwierciedla rozegranego meczu otwarcia |
| Drabinka Mundialu | `/mundial/drabinka` | działa, ale wygląda jak atrapowy forecast zamiast rzeczywistej drabinki |
| Mecze Mundialu | `/mundial/mecze` | działa, ale pokazuje 72 spotkania fazy grupowej pod nagłówkiem „Wszystkie mecze” |
| Statystyki | `/stats` | działa, ale pokazuje same zera i surowe kody lig |
| Ligi | `/ligi` | publiczny render nie zawiera użytecznej treści poza tytułem |
| Newsy | `/newsy` | przekierowanie do logowania |
| Kupony | `/kupony` | przekierowanie do logowania — logiczne dla funkcji prywatnej |
| Logowanie | `/login` | działa, ale przepływ Telegram wymaga dopracowania i czytelnego feedbacku |
| Szczegóły meczu | `/mecz/[id]` | routing istnieje; publiczny render nie ujawnia treści szczegółowej do pełnego audytu |

---

# 4. Krytyczne błędy do naprawy przed redesignem

## P0.1 — Strona główna pokazuje stare typy zamiast aktualnych

Na landing page w sekcji „Topowe typy na dziś” widoczne są spotkania z datą **środa, 10 czerwca**, mimo że audyt został wykonany **piątek, 12 czerwca**. Jednocześnie `/typy` pokazuje już kalendarz dla 12 czerwca.

### Skutek biznesowy

Użytkownik może uznać, że model nie działa, typy nie aktualizują się lub strona jest porzucona.

### Prawdopodobne przyczyny do sprawdzenia

- cache strony głównej lub endpointu,
- statycznie wygenerowane dane przy buildzie,
- inny endpoint dla `/` i `/typy`,
- błędne filtrowanie „dzisiaj” po UTC,
- brak rewalidacji po zmianie dnia,
- klient otrzymuje stary payload z cache routera.

### Docelowa poprawka

- jeden wspólny serwis danych dla homepage i `/typy`,
- filtrowanie po zakresie dnia użytkownika lub jasno zdefiniowanym dniu aplikacji,
- endpoint live/today bez trwałego cache,
- test integracyjny porównujący homepage z `/typy`.

---

## P0.2 — Godziny Mundialu są najpewniej wyświetlane jako UTC, bez konwersji do czasu lokalnego

Przykład:

- oficjalny mecz Kanada — Bośnia i Hercegowina jest wskazany przez FIFA Hospitality jako **12 czerwca, 3:00 PM ET**,
- strona LUPUS BETS pokazuje **12 czerwca, 19:00**,
- 19:00 odpowiada UTC, a w Polsce powinno zostać pokazane **21:00 CEST**.

Analogiczny problem występuje przy innych spotkaniach.

### Skutek biznesowy

To błąd krytyczny dla serwisu meczowego. Użytkownik może przegapić spotkanie lub odczytać typ jako nieaktualny.

### Docelowa zasada

- w bazie przechowywać wyłącznie czas UTC w ISO 8601,
- na froncie formatować czas przez `Intl.DateTimeFormat()` w strefie przeglądarki,
- obok filtrów dodać małą informację: `Godziny: czas lokalny urządzenia`,
- opcjonalnie umożliwić ręczną zmianę strefy.

---

## P0.3 — Niespójność daty i godziny tego samego meczu

Na `/mundial` mecz Kanada — Bośnia i Hercegowina widnieje jako **12 czerwca, 19:00**, natomiast na `/typy` ten sam mecz jest pokazany jako **12.06, 00:00**.

### Możliwe źródło błędu

- typ powstał z datą bez czasu i został znormalizowany do północy,
- różne źródła danych dla typów i terminarza,
- błędne mapowanie fixture ID,
- zapis daty lokalnej zamiast pełnego znacznika UTC.

### Wymagana poprawka

Fixture musi być jedną encją referencyjną. Predykcja powinna przechowywać `fixture_id`, a nie własną kopię daty meczu jako źródło prawdy.

---

## P0.4 — Mundial pozostaje częściowo w stanie „przed startem”, chociaż turniej już ruszył

Landing page nadal pokazuje:

- „Mundial startuje już wkrótce”,
- „Mecz otwarcia 11 czerwca”,
- placeholdery licznika `— dni / — godz / — min / — sek`,
- „Tryb Mundialu — w przygotowaniu”.

Tymczasem audyt odbywa się 12 czerwca, a oficjalny mecz otwarcia został rozegrany 11 czerwca.

### Wymagana poprawka

Sekcja powinna działać jako state machine:

```text
PRE_TOURNAMENT -> LIVE_TOURNAMENT -> KNOCKOUT_STAGE -> FINISHED
```

Dla każdego stanu potrzebna jest osobna treść:

- przed startem: countdown,
- podczas turnieju: najbliższy mecz, mecze live, tabela grup,
- faza pucharowa: drabinka,
- po finale: zwycięzca, statystyki modelu i historia typów.

---

## P0.5 — Tabela grup nie aktualizuje wyników po rozegranym meczu

`/mundial/grupy` pokazuje grupę A z bilansem `0 0 0 0 0:0 0`, mimo że mecz otwarcia Meksyk — RPA był już zaplanowany na 11 czerwca.

### Do sprawdzenia

- czy status fixture przechodzi na `FT`,
- czy worker pobiera wyniki Mundialu,
- czy tabela jest obliczana dynamicznie czy pochodzi z seeda,
- czy istnieje endpoint standings dla turnieju,
- czy identyfikator ligi i sezonu są prawidłowe.

---

## P0.6 — Duplikaty typów na `/typy`

Dla 12 czerwca widoczne są dwa wizualnie identyczne wpisy Kanada — Bośnia i Hercegowina. Po wylogowaniu oba są nierozróżnialne.

### Możliwe przyczyny

- dwa rekordy dla różnych rynków, ale UI ukrywa różnicę,
- powielone rekordy z procesu synchronizacji,
- brak unikalnego constraintu,
- predykcja została zapisana ponownie po ponownym uruchomieniu workera.

### Docelowy constraint

Przykładowy klucz unikalny:

```text
(fixture_id, market, selection, model_version)
```

Dodatkowo endpoint listy typów powinien deduplikować rekordy defensywnie.

---

## P0.7 — Nieprawidłowe nazewnictwo rynku Team Over 1.5

Karty pokazują jednocześnie:

- nagłówek `Over 1.5`,
- opis `Powyżej 1.5 gola — away`.

To sugeruje rynek **Team Over 1.5 gości**, a nie klasyczny **Over 1.5 w meczu**.

### Docelowe nazewnictwo

Zamiast:

```text
Over 1.5
Powyżej 1.5 gola — away
```

pokazać:

```text
TEAM OVER 1.5
Fortaleza EC strzeli min. 2 gole
Goście · kurs 2.37
```

W filtrach można użyć krótszej etykiety:

```text
Team O1.5
```

Rynek całego meczu, jeżeli kiedyś występuje, powinien mieć osobną etykietę:

```text
Match O1.5
```

---

## P0.8 — „Topowe typy” zawierają ujemny edge

Na stronie głównej promowane są typy z wartościami `Edge -2.5%`, `-2.0%`, `-2.6%`.

Jeżeli `edge` oznacza przewagę modelu nad prawdopodobieństwem implikowanym z kursu, typ z ujemną wartością nie powinien być rekomendacją value. Należy sprawdzić definicję pola i sposób liczenia.

### Docelowa logika

- `edge > 0`: potencjalna wartość,
- `edge <= 0`: brak value; typ może pozostać analizą, ale nie powinien trafić do sekcji „Topowe typy”,
- w UI wyświetlać tooltip z definicją,
- oddzielić `model_probability`, `implied_probability`, `edge`, `Q-Score`.

---

## P0.9 — Strona `/mundial/mecze` nazywa 72 spotkania „wszystkimi meczami”

FIFA World Cup 2026 obejmuje **104 spotkania**. Publiczna strona LUPUS BETS pokazuje `72 meczów`, czyli liczbę odpowiadającą fazie grupowej, mimo że filtry zawierają także rundy pucharowe.

### Poprawka

- jeżeli dostępna jest tylko faza grupowa: nagłówek `Mecze fazy grupowej — 72`,
- jeżeli widok ma obejmować cały turniej: wczytać komplet 104 spotkań,
- rundy pucharowe przed ustaleniem drużyn pokazywać jako placeholdery zależne od pozycji w grupach, np. `1A vs 3C/D/E/F`.

---

## P0.10 — Drabinka Mundialu wygląda jak atrapowa i logicznie niespójna

Na `/mundial/drabinka` już przed rozstrzygnięciem grup widoczne są konkretne zespoły oraz procenty szans. Dalsze rundy zawierają placeholdery i powtarzające się procenty. Publicznie wygląda to jak dane testowe.

### Dwie poprawne wersje produktu

**Wersja A — rzeczywista drabinka:**  
Pokazywać wyłącznie wynikającą z regulaminu strukturę oraz placeholdery do czasu rozstrzygnięcia grup.

**Wersja B — symulacja modelu:**  
Osobna zakładka `Prognozowana drabinka`, wyraźnie oznaczona jako symulacja, z informacją o dacie ostatniego przeliczenia i metodzie Monte Carlo.

Nie mieszać obu wersji w jednym ekranie.

---

# 5. Istotne błędy i problemy UX

## P1.1 — Sprzeczna polityka dostępu bez logowania

Landing page informuje:

> Bez logowania widzisz dzisiejsze typy i podstawowe wskaźniki.

Jednocześnie `/typy` pokazuje komunikat, że logowanie odblokowuje typ, kurs, Q-Score, kalendarz i statystyki.

### Decyzja produktowa do wdrożenia

Najlepszy model freemium dla startu:

- bez logowania: mecze dnia + maksymalnie 2 pełne topowe typy jako teaser,
- po zalogowaniu przez Telegram: pełne typy, filtry, Q-Score, historia, zapis kuponów,
- później: dodatkowa warstwa premium, jeżeli produkt będzie monetyzowany.

Komunikaty muszą być identyczne na `/`, `/typy` i `/login`.

---

## P1.2 — Surowe kody lig

Na `/stats` widoczne są wartości:

```text
SE2 BRA_SERIE J1 SP2 WC2026 COL_PRIMER JAP_J2
```

### Poprawka

Dodać centralny słownik lig:

```ts
{
  code: 'BRA_SERIE_B',
  displayName: 'Brazylia · Série B',
  shortName: 'Série B',
  countryName: 'Brazylia',
  countryCode: 'BR',
  logoUrl,
  apiSportsLeagueId,
  tier: 2
}
```

W interfejsie nigdy nie wyświetlać kodów technicznych.

---

## P1.3 — Niespójność języka

Przykłady:

- `Grupa Group A`,
- `Czech Republic` obok `USA`,
- `South Korea`, `Bosnia & Herzegovina`,
- `away`,
- `Wc2026`.

### Poprawka

Wprowadzić spójny polski layer prezentacji:

```text
Grupa A
Czechy
Korea Południowa
Bośnia i Hercegowina
Goście
MŚ 2026
```

W bazie można zachować angielskie wartości źródłowe. Tłumaczenia należą do warstwy UI.

---

## P1.4 — Statystyki pokazują „0”, zamiast budować zaufanie

`/stats` pokazuje:

- Typy: `0`,
- Trafione: `0`,
- Skuteczność: `0.0%`,
- ROI: `+0.0%`.

Jeżeli nie ma jeszcze rozliczonych typów, potrzebny jest uczciwy empty state:

```text
Pierwsze zweryfikowane wyniki pojawią się po rozliczeniu aktywnych typów.
Model automatycznie aktualizuje wyniki po zakończeniu spotkań.
```

Jeżeli historia istnieje w bocie, trzeba ją zsynchronizować ze stroną.

---

## P1.5 — Zakładka `Ligi` jest pusta lub niewyrenderowana

`/ligi` nie dostarcza użytecznej publicznej treści. Należy zweryfikować rendering klienta, pobieranie danych i obsługę błędów.

### Docelowa strona ligi

- nazwa i kraj,
- liczba typów,
- skuteczność modelu,
- ROI,
- tabela ligowa,
- nadchodzące mecze,
- ostatnie wyniki,
- najlepsze drużyny dla BTTS,
- najlepsze drużyny dla Team Over 1.5,
- rozkład goli home / away.

---

## P1.6 — `Newsy` wymagają logowania

Dla serwisu contentowego newsy powinny być publiczne. Jeżeli moduł nie jest gotowy, lepiej tymczasowo ukryć link niż kierować do logowania.

---

## P1.7 — Brakuje czytelnego statusu meczu

Dla spotkań potrzebne są stany:

```text
Zaplanowany
Za 25 min
LIVE · 63'
Przerwa
Zakończony
Przełożony
Odwołany
Po dogrywce
Po karnych
```

Dla meczu live karta musi pokazywać:

- wynik,
- minutę,
- status,
- ewentualnie czerwone kartki,
- stan typu: `aktualnie trafiony`, `aktualnie nietrafiony`, `oczekuje`.

---

## P1.8 — Brakuje rozróżnienia: prawdopodobieństwo, Q-Score, kurs i edge

Użytkownik powinien rozumieć, że:

- **Prawdopodobieństwo** = wynik modelu dla zdarzenia,
- **Kurs** = kurs bukmacherski,
- **Edge** = przewaga względem kursu po zdefiniowanej metodzie,
- **Q-Score** = wewnętrzna ocena jakości sygnału.

Nie należy opisywać prawdopodobieństwa jako „pewności modelu”, ponieważ brzmi jak gwarancja.

Lepsze etykiety:

```text
Szansa wg modelu: 62%
Q-Score: 81 / 100
Kurs referencyjny: 1.72
Edge modelu: +6.3 pp
```

---

# 6. Docelowa architektura informacji

## 6.1. Nawigacja desktop

```text
[LUPUS BETS logo]
Start | Typy | Live | Statystyki | Ligi | Mundial | Kupony
[Telegram] [Motyw] [Profil / Zaloguj]
```

### Zasady

- `Live` należy wydzielić jako osobną zakładkę, ponieważ inny jest kontekst użytkownika oglądającego trwające spotkania.
- `Newsy` można umieścić niżej: w footerze albo po wdrożeniu kompletnego modułu contentowego.
- `Kupony` pozostają prywatne.

## 6.2. Nawigacja mobile

Dolny pasek nawigacyjny:

```text
Start | Typy | Live | Statystyki | Profil
```

Pozostałe elementy w menu bocznym:

```text
Mundial | Ligi | Kupony | Newsy | Ustawienia | Telegram
```

---

# 7. Nowy kierunek wizualny

## 7.1. Charakter marki

Rekomendowany styl:

> **premium football analytics terminal** — wiarygodny panel analityczny, nie krzykliwa strona kasynowa.

LUPUS BETS powinien wizualnie łączyć:

- czytelność Flashscore,
- głębię danych Sofascore,
- sportowy rytm FotMob,
- klarowność kursów i historii OddsPortal,
- własny wyróżnik: Q-Score, predykcja Lupus Bot i identyfikacja z psem / wilkiem.

## 7.2. Paleta barw

### Motyw główny: `Graphite Night`

| Token | Proponowana wartość | Użycie |
|---|---:|---|
| `--bg` | `#0B0F14` | tło aplikacji |
| `--surface-1` | `#111821` | podstawowe karty |
| `--surface-2` | `#17212C` | podbite elementy |
| `--surface-3` | `#1E2B38` | hover / selected |
| `--border` | `rgba(255,255,255,0.08)` | subtelne obramowania |
| `--text-primary` | `#F4F7FA` | tekst główny |
| `--text-secondary` | `#9CAABD` | tekst pomocniczy |
| `--brand-gold` | `#D6A84B` | logo, Q-Score premium, CTA drugorzędne |
| `--signal-green` | `#35D07F` | trafienie, dodatni edge, sukces |
| `--live-red` | `#FF5C68` | LIVE, nietrafiony typ, alert |
| `--info-blue` | `#5FA8FF` | informacja, neutralny status |
| `--warning-amber` | `#F2B84B` | ostrzeżenie, średnia jakość |

### Zasada koloru

- złoto = marka i premium,
- zieleń = pozytywny wynik lub value,
- czerwony = live albo negatywny wynik,
- nie używać zieleni wyłącznie dekoracyjnie, aby nie rozmywać znaczenia danych.

## 7.3. Typografia

Rekomendacja:

- nagłówki: `Space Grotesk` lub `Manrope`,
- interfejs i liczby: `Inter`,
- liczby w KPI: `font-variant-numeric: tabular-nums`.

## 7.4. Karty

Zamiast wielu dużych kafelków zastosować hierarchię:

1. **2 topowe typy dnia** — większe, wyróżnione karty hero,
2. **pozostałe typy** — kompaktowa lista lub tabela,
3. **live** — osobny wariant z wynikiem i minutą,
4. **rozliczone** — czytelna zielona / czerwona belka statusu.

### Desktop: przykładowy wiersz typu

```text
[logo ligi] Brazylia · Série B          Dziś · 21:30
Náutico Recife          vs          Fortaleza EC
TEAM O1.5 · Fortaleza EC min. 2 gole
Q 82     Model 61%     Kurs 1.86     Edge +7.2 pp
[Zobacz analizę] [Dodaj do kuponu]
```

### Mobile

- pierwsza linia: liga + czas + status,
- druga linia: zespoły i logo,
- trzecia: rynek,
- czwarta: Q-Score, model, kurs, edge,
- rozwinięcie po tapnięciu.

## 7.5. Animacje i mikrointerakcje

Stosować oszczędnie:

- hover karty: `150–200 ms`, delikatne uniesienie i podbicie borderu,
- live: subtelny puls punktu, bez migającego całego kafelka,
- zmiana wyniku: krótki highlight,
- skeleton loader zamiast skaczącego layoutu,
- filtrowanie: płynne przejście listy,
- wykresy: prosta animacja wejścia, bez przesady.

---

# 8. Przebudowa stron

## 8.1. Landing page `/`

### Docelowa kolejność sekcji

1. **Hero**
   - hasło: `Analiza, nie przeczucie.`
   - opis silnika,
   - CTA: `Zobacz dzisiejsze typy`,
   - CTA drugorzędne: `Otwórz bota Telegram`,
   - informacja: `Dane aktualizowane automatycznie`.

2. **Top 2 typy dnia**
   - dokładnie dwa najlepsze aktywne typy,
   - bez ujemnego edge,
   - każdy z czytelnym marketem,
   - po zalogowaniu więcej szczegółów.

3. **Pasek wiarygodności**
   - liczba rozliczonych typów,
   - skuteczność 30 dni,
   - ROI 30 dni,
   - czas ostatniej aktualizacji.

4. **Mecze live**
   - tylko gdy rzeczywiście trwają,
   - wynik, minuta, status typu.

5. **Jak działa model**
   - Dixon-Coles,
   - ELO,
   - kalibracja,
   - Q-Score,
   - auto-weryfikacja.

6. **Mundial 2026**
   - komponent zależny od aktualnego stanu turnieju.

7. **Telegram**
   - korzyści: powiadomienia, szybki dostęp, logowanie.

8. **Responsible gaming**
   - 18+ i jasny disclaimer.

## 8.2. Typy `/typy`

### Układ desktop

Lewa kolumna filtrów lub pasek sticky:

```text
Data | Rynek | Liga | Min Q-Score | Status | Sortowanie | Tylko dodatni edge
```

Główna lista:

- podział na ligi,
- możliwość widoku `Karty` / `Tabela`,
- status live i rozliczony,
- możliwość zapisania typu do kuponu.

### Kalendarz

Obecny miesięczny kalendarz może zostać zachowany, ale powinien mieć dwa tryby:

- kompaktowy tygodniowy pasek domyślnie,
- pełny miesiąc po rozwinięciu.

Na mobile domyślnie pasek 7 dni zamiast pełnej planszy miesiąca.

## 8.3. Szczegóły meczu `/mecz/[id]`

### Sekcje

1. scoreboard:
   - liga,
   - data i lokalna godzina,
   - logo zespołów,
   - wynik,
   - minuta live,
   - status.

2. rekomendacja:
   - rynek,
   - selekcja,
   - Q-Score,
   - prawdopodobieństwo,
   - kurs,
   - edge,
   - stan typu.

3. wyjaśnienie modelu:
   - krótkie punkty: forma, gole home / away, xG jeżeli dostępne, BTTS rate, Team O1.5 rate.

4. forma zespołów:
   - ostatnie 5–10 meczów,
   - osobno dom / wyjazd,
   - czytelne znaczniki wyników.

5. H2H:
   - ostatnie spotkania,
   - BTTS,
   - overy,
   - gole.

6. live timeline:
   - gole,
   - kartki,
   - zmiany,
   - ważne zdarzenia.

7. statystyki live:
   - posiadanie,
   - strzały,
   - strzały celne,
   - rzuty rożne,
   - xG, jeżeli API i liga je udostępniają.

8. kursy:
   - aktualny kurs,
   - kurs początkowy,
   - miniwykres trendu.

## 8.4. Statystyki `/stats`

### KPI na górze

```text
Typy | Trafione | Skuteczność | ROI | Śr. kurs | Śr. Q-Score
```

### Wykresy

1. krzywa skumulowanego ROI,
2. skuteczność w czasie,
3. skuteczność według rynku,
4. ROI według ligi,
5. kalibracja modelu: prognozowane prawdopodobieństwo vs rzeczywista trafialność,
6. histogram Q-Score,
7. tabela historii typów.

### Filtry

```text
7 dni | 30 dni | 90 dni | Całość
Rynek
Liga
Min. Q-Score
Status
```

### Ważne

Nie pokazywać wykresów z fikcyjnymi danymi. Przy braku rekordów stosować dopracowany empty state.

## 8.5. Ligi `/ligi`

### Widok listy

- wyszukiwarka,
- popularne ligi,
- wszystkie kraje,
- liczba aktywnych meczów,
- liczba dzisiejszych typów,
- badge live.

### Widok ligi `/ligi/[slug]`

- statystyki ligi,
- tabela,
- terminarz,
- forma drużyn,
- ranking BTTS,
- ranking Team Over 1.5,
- historia typów Lupus Bot.

## 8.6. Mundial `/mundial`

### Widok główny

- dzisiejsze mecze,
- live,
- najbliższy mecz,
- tabela grup po rozegranych spotkaniach,
- typy MŚ,
- link do drabinki.

### Grupy

- taby A–L,
- pełne polskie nazwy,
- logo flag,
- punkty,
- bilans,
- następny mecz,
- prawdopodobieństwo awansu tylko jako osobna warstwa analityczna.

### Drabinka

- `Rzeczywista drabinka`,
- opcjonalnie osobny tab `Prognoza modelu`,
- poprawna liczba rund i slotów,
- bez atrapowych zespołów w rzeczywistym widoku.

## 8.7. Kupony `/kupony`

- tworzenie własnego kuponu,
- status każdego zdarzenia,
- łączny kurs,
- stawka,
- potencjalna wygrana,
- ROI prywatne,
- historia,
- eksport / udostępnienie w Telegramie.

## 8.8. Logowanie `/login`

### Docelowy flow Telegram

1. użytkownik klika `Zaloguj przez Telegram`,
2. otwiera się bot z jednorazowym tokenem deep-link,
3. użytkownik naciska START,
4. bot potwierdza logowanie,
5. strona automatycznie odświeża status lub pokazuje przycisk `Sprawdź status`,
6. po sukcesie redirect do poprzedniej strony.

### UI

- jasny komunikat krok po kroku,
- widoczny stan oczekiwania,
- timeout tokenu,
- błąd i możliwość ponowienia,
- brak martwego przycisku email, dopóki funkcja nie działa.

---

# 9. Architektura danych live

## 9.1. Zalecany podział odpowiedzialności

```text
API-Sports / API-Football
        ↓
Oracle worker: pobieranie fixtures, live, wyników i statystyk
        ↓
Oracle DB: jedno źródło prawdy
        ↓
Oracle backend API lub bezpieczny proxy endpoint
        ↓
Vercel frontend
        ↓
Użytkownik web / Telegram bot
```

### Zasady

- klucza API-Sports nie udostępniać w przeglądarce,
- frontend nie powinien bezpośrednio pobierać danych z API-Sports,
- bot i strona powinny czytać z tej samej warstwy danych,
- fixture ma jedno ID źródłowe i pełny timestamp UTC,
- prediction odwołuje się do fixture po ID.

## 9.2. Polling

API-Football rekomenduje jako punkt startowy polling `/fixtures?live=all` co 60 sekund. Jedno wywołanie zwraca wynik, status i minutę trwających spotkań. Częstsze odpytywanie eventów lub statystyk należy dodawać dopiero po analizie limitu planu API.

### Proponowane interwały

| Dane | Interwał | Uwagi |
|---|---:|---|
| Fixtures live | 60 s | tylko gdy są aktywne mecze |
| Zdarzenia live | 15–30 s | późniejszy etap, zależnie od limitu |
| Statystyki live | 60–120 s | tylko dla otwartego szczegółu meczu lub najważniejszych lig |
| Terminarz 7 dni | 6 h | odświeżenie także ręczne po sync |
| Dane ligi | 24 h | tabele częściej po zakończonych meczach |
| Wyniki zakończonych | 5–15 min | do auto-weryfikacji |
| Metadane lig i drużyn | 7 dni | cache długoterminowy |

## 9.3. Cache Next.js / Vercel

Dla danych live nie używać trwałego cache. W zależności od wersji Next.js stosować:

```ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

lub dla konkretnego fetch:

```ts
fetch(url, { cache: 'no-store' })
```

Dla terminarza i metadanych stosować kontrolowaną rewalidację:

```ts
fetch(url, { next: { revalidate: 300 } })
```

Ważne: przed zmianą należy sprawdzić wersję Next.js i aktualny sposób pobierania danych. Nie wprowadzać globalnie `no-store` dla wszystkiego, ponieważ pogorszy to wydajność i zwiększy obciążenie.

## 9.4. Model danych — minimalne encje

```text
leagues
teams
fixtures
fixture_events
fixture_statistics
predictions
prediction_verifications
odds_snapshots
users
telegram_auth_tokens
user_coupons
user_coupon_items
```

### Minimalne pola fixture

```text
id
provider_fixture_id
league_id
season
home_team_id
away_team_id
kickoff_at_utc
status
elapsed_minute
home_score
away_score
updated_at
```

### Minimalne pola prediction

```text
id
fixture_id
market
selection
model_probability
implied_probability
edge
q_score
reference_odds
model_version
created_at
verification_status
```

---

# 10. Reguły integralności danych

Dodać testy i monitoring dla następujących warunków:

```text
1. Fixture zawsze ma kickoff_at_utc.
2. Prediction zawsze wskazuje istniejący fixture_id.
3. Brak duplikatu (fixture_id, market, selection, model_version).
4. Karta LIVE zawsze ma score i status live.
5. Jeżeli status = FT, wynik musi zostać zapisany.
6. Jeżeli fixture = FT, predykcja musi przejść do weryfikacji.
7. Homepage i /typy korzystają z tej samej listy typów dnia.
8. Topowy typ nie może mieć ujemnego edge, jeżeli edge oznacza value.
9. UI nigdy nie pokazuje technicznego kodu ligi.
10. UI nie pokazuje północy 00:00, jeżeli źródło ma prawdziwą godzinę.
11. Mundial: licznik i treść zależą od stanu turnieju.
12. Mundial: rzeczywista tabela grup aktualizuje się po FT.
13. Mundial: all matches = 104 albo widok jest jawnie nazwany fazą grupową = 72.
```

---

# 11. Monitoring i obserwowalność

Dodać prosty panel techniczny dostępny tylko dla administratora:

```text
Last API-Sports sync
Last live poll
Active fixtures count
Fixtures updated in last 10 min
Predictions generated today
Predictions waiting for verification
Duplicate predictions detected
API quota used today
Worker status
Database status
```

Dodać logi strukturalne i alerty dla:

- braku synchronizacji przez >10 min podczas meczów live,
- błędów API-Sports,
- wyczerpywania limitu API,
- duplikatów predykcji,
- niezweryfikowanych spotkań `FT`,
- rozbieżności czasu.

---

# 12. Dostępność, SEO i wydajność

## Dostępność

- kontrast WCAG AA,
- pełna obsługa klawiatury,
- widoczny focus,
- aria-label dla ikon,
- nie polegać wyłącznie na kolorze przy wyniku typu,
- tabele z nagłówkami,
- tekstowe statusy obok badge.

## SEO

- unikalny title i description dla każdej strony,
- Open Graph dla udostępniania typów,
- sitemap,
- robots,
- canonical,
- JSON-LD tylko tam, gdzie ma sens,
- nie indeksować prywatnych kuponów.

## Wydajność

- lazy-load ciężkich wykresów,
- skeletony,
- kompresja grafik,
- SVG dla ikon,
- ograniczenie client-side JS,
- server components dla statycznych sekcji,
- dynamiczne pobieranie tylko tam, gdzie dane muszą być świeże.

---

# 13. Pakiet własnych grafik do przygotowania

## Priorytet 1 — identyfikacja marki

1. logo główne poziome `LUPUS BETS`,
2. sygnet psa / wilka w wersji uproszczonej,
3. favicon,
4. Telegram avatar,
5. ikona PWA,
6. wersje jasna / ciemna / monochromatyczna,
7. SVG zoptymalizowane do web.

## Priorytet 2 — grafiki interfejsu

1. subtelne tło hero: kontur wilka + siatka boiska + delikatne linie danych,
2. ikony rynków:
   - BTTS,
   - Team O1.5,
   - Mix,
   - Thriller,
3. ilustracje empty state:
   - brak typów,
   - brak meczów live,
   - pierwsze statystyki wkrótce,
   - kupon pusty,
4. badge Q-Score,
5. szablon karty typu do udostępnienia.

## Priorytet 3 — social i Mundial

1. Open Graph 1200×630,
2. karta dziennego typu do Telegrama,
3. grafika trafionego typu,
4. grafika wyników tygodnia,
5. baner Mundial 2026,
6. tła dla grup i drabinki,
7. zestaw flag i spójnych badge reprezentacji.

### Styl grafik

- ciemne tło,
- subtelna złota identyfikacja,
- sportowa analityka zamiast kasynowego neonowego przepychu,
- prosty, rozpoznawalny pies / wilk,
- mocna czytelność na telefonie.

---

# 14. Benchmarki — czego się uczyć, czego nie kopiować

## Flashscore

Warto wykorzystać:

- bardzo czytelną listę meczów,
- wyniki live bez ręcznego odświeżania,
- statusy, tabele, H2H, składy, statystyki i kursy,
- prostą hierarchię informacji.

Nie kopiować:

- nadmiaru danych na pierwszym ekranie.

## Sofascore

Warto wykorzystać:

- głębokie szczegóły meczu,
- minutę live, scorers, kartki i zmiany,
- wizualne statystyki,
- czytelne profile zespołów i lig.

Nie kopiować:

- zbyt rozbudowanej liczby funkcji na start.

## FotMob

Warto wykorzystać:

- matchday-first UX,
- czytelne karty spotkań,
- xG, shot mapy i momentum jako późniejszy etap,
- personalizację.

Nie kopiować:

- rozbudowanego newsroomu przed dopracowaniem core produktu.

## OddsPortal

Warto wykorzystać:

- historię kursów,
- porównywanie wartości,
- archiwum wyników i kursów.

Nie kopiować:

- wyglądu klasycznego agregatora bukmacherskiego.

## Własny wyróżnik LUPUS BETS

LUPUS BETS powinien być znacznie bardziej wyspecjalizowany:

```text
mniej chaosu niż livescore,
więcej wyjaśnionej predykcji,
pełna transparentność wyników,
Q-Score,
Team Over 1.5,
Telegram jako drugi interfejs.
```

---

# 15. Kolejność wdrażania

## Etap 0 — bezpieczeństwo pracy

- utworzyć backup,
- utworzyć osobną gałąź,
- nie ruszać starego serwera Oracle ani produkcyjnego bota,
- uruchomić lokalne środowisko,
- zinwentaryzować stack i wersje.

## Etap 1 — naprawa danych P0

- wspólne źródło typów dla homepage i `/typy`,
- timestamp UTC i czas lokalny,
- synchronizacja fixture ID,
- usunięcie duplikatów,
- nazwy rynków,
- walidacja edge,
- poprawa Mundialu,
- tabela grup,
- właściwe liczniki 72 / 104.

## Etap 2 — design system

- tokeny,
- typografia,
- przyciski,
- badge,
- karty,
- tabele,
- loading i empty states,
- responsive layout,
- mobile bottom nav.

## Etap 3 — redesign stron głównych

- landing,
- `/typy`,
- `/mecz/[id]`,
- `/stats`,
- `/ligi`,
- `/mundial`.

## Etap 4 — live UX

- minuta,
- wynik,
- timeline,
- stan typu,
- polling,
- quota guard,
- monitoring.

## Etap 5 — logowanie i kupony

- Telegram auth,
- kupony,
- prywatne ROI,
- udostępnianie.

## Etap 6 — grafiki i social

- logo SVG,
- hero,
- empty states,
- OG,
- karty Telegram.

## Etap 7 — QA i produkcja

- testy desktop / mobile,
- testy timezone,
- testy live podczas rzeczywistego spotkania,
- testy cache,
- testy API quota,
- stopniowe wdrożenie.

---

# 16. Gotowy prompt startowy dla Claude Code

Skopiować do Claude Code po otwarciu repozytorium:

```text
Pracujemy nad projektem LUPUS BETS. Najpierw przeczytaj cały plik audytu `lupus-bets-audyt-redesign-claude-code.md` i potraktuj go jako specyfikację projektu.

Zasady bezpieczeństwa:
1. Nie wykonuj żadnych zmian na serwerze Oracle i nie restartuj produkcyjnego bota.
2. Nie wykonuj push ani merge bez mojego potwierdzenia.
3. Najpierw tylko zinwentaryzuj repozytorium, stack, zależności, routing, modele danych, endpointy, sposób pobierania API-Sports, mechanizm cache, logowanie Telegram i obecne testy.
4. Sprawdź git status, aktualną gałąź i utwórz plan pracy.
5. Zweryfikuj, które błędy P0 z audytu wynikają z kodu frontendowego, które z backendu, a które z danych.
6. Zaproponuj minimalny bezpieczny zestaw zmian dla Etapu 1. Nie implementuj redesignu przed naprawą spójności danych.
7. Wszystkie sekrety mają pozostać poza repozytorium. Nie wyświetlaj pełnych kluczy API ani tokenów.

Najpierw przygotuj raport:
- struktura repozytorium,
- stack i wersje,
- routing,
- źródła danych dla `/`, `/typy`, `/stats`, `/ligi`, `/mundial`, `/mecz/[id]`,
- mechanizm cache,
- przyczyna starych typów na homepage,
- przyczyna godzin UTC,
- przyczyna `00:00` na `/typy`,
- przyczyna duplikatów,
- sposób zapisu marketów,
- definicja edge,
- sposób synchronizacji wyników Mundialu,
- obecny schemat bazy,
- plan migracji i testów.

Po raporcie zatrzymaj się i czekaj na zatwierdzenie.
```

---

# 17. Checklist akceptacyjny przed produkcją

## Dane

- [ ] Homepage i `/typy` pokazują ten sam dzień i ten sam zestaw typów.
- [ ] Godziny są poprawne w Europe/Warsaw i innej testowej strefie.
- [ ] Ten sam fixture ma tę samą godzinę na każdej podstronie.
- [ ] Brak duplikatów.
- [ ] Team Over 1.5 wskazuje drużynę.
- [ ] Edge ma zweryfikowaną definicję.
- [ ] Topowe typy nie zawierają ujemnego value edge.
- [ ] Wszystkie ligi mają czytelne nazwy.
- [ ] Mundial nie pokazuje stanu przedstartowego po rozpoczęciu turnieju.
- [ ] Tabela grup aktualizuje się po FT.
- [ ] Widok all matches poprawnie obsługuje 104 spotkania albo jasno mówi o 72 spotkaniach fazy grupowej.

## UX

- [ ] Na desktopie i mobile karta typu jest czytelna w 3 sekundy.
- [ ] Status live ma wynik i minutę.
- [ ] Empty state nie udaje statystyk.
- [ ] Newsy są publiczne albo link jest ukryty.
- [ ] Kupony wymagają logowania.
- [ ] Logowanie Telegram ma feedback i obsługę błędów.
- [ ] Q-Score, szansa modelu, kurs i edge są rozróżnione.

## Techniczne

- [ ] Klucz API-Sports nie trafia do klienta.
- [ ] Live endpoint nie jest trwale cache’owany.
- [ ] Terminarz i metadane mają kontrolowany cache.
- [ ] Worker ma monitoring.
- [ ] API quota ma alert.
- [ ] Test live wykonano podczas rzeczywistego spotkania.
- [ ] Brak regresji bota Telegram.

---

# 18. Źródła użyte w audycie

## Publiczne strony LUPUS BETS

- https://nova-pulse-sage.vercel.app/
- https://nova-pulse-sage.vercel.app/typy
- https://nova-pulse-sage.vercel.app/stats
- https://nova-pulse-sage.vercel.app/ligi
- https://nova-pulse-sage.vercel.app/mundial
- https://nova-pulse-sage.vercel.app/mundial/grupy
- https://nova-pulse-sage.vercel.app/mundial/drabinka
- https://nova-pulse-sage.vercel.app/mundial/mecze
- https://nova-pulse-sage.vercel.app/login

## Dane i dokumentacja

- API-Football docs: https://www.api-football.com/documentation-v3
- API-Football getting started: https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide
- API-Sports football: https://api-sports.io/sports/football
- Next.js caching guide: https://nextjs.org/docs/app/guides/caching-without-cache-components
- Next.js fetch docs: https://nextjs.org/docs/app/api-reference/functions/fetch
- Next.js route handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- FIFA schedule: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
- FIFA updated schedule release: https://inside.fifa.com/organisation/media-releases/updated-world-cup-2026-match-schedule-venues-kick-off-times-104-matches

## Benchmarki

- Flashscore: https://www.flashscore.com/
- Sofascore: https://www.sofascore.com/
- FotMob: https://www.fotmob.com/
- OddsPortal: https://www.oddsportal.com/football/

