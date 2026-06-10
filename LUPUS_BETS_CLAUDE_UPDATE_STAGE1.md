# LUPUS BETS — raport audytu i plan wdrożenia ETAPU 1

## Cel dokumentu

Dokument służy jako briefing dla Claude Code podczas dalszej pracy nad aplikacją `nova-pulse`.
Repozytorium: `mtkittles/nova-pulse`  
Wdrożenie Vercel: `https://nova-pulse-sage.vercel.app/`

Zatwierdzona baza identyfikacji wizualnej:
- geometryczna głowa psa typu ogar polski,
- nowoczesny i minimalistyczny styl,
- paleta: ciemny granat, biel, jasny cyjan,
- motyw analizy danych, predykcji i piłki nożnej,
- podstawowe warianty logo: sam sygnet, układ poziomy i układ pionowy.

W paczce znajdują się pierwsze produkcyjne pliki SVG oraz gotowe komponenty React:
- `public/brand/lupus-bets-mark.svg`
- `public/brand/lupus-bets-mark-small.svg`
- `public/brand/lupus-bets-horizontal.svg`
- `public/brand/lupus-bets-stacked.svg`
- `public/brand/lupus-bets-mono-white.svg`
- `public/brand/lupus-bets-mono-dark.svg`
- `public/favicon.svg`
- `components/ogar-logo.tsx`
- `components/brand.tsx`

> Ważne: pliki SVG są czystym wektorem i nadają się do wdrożenia. To pierwsza rekonstrukcja zaakceptowanej koncepcji, dlatego geometrię można później dopracować bez zmiany architektury.

---

# 1. Podsumowanie audytu

Strona jest funkcjonalnym i atrakcyjnym wizualnie MVP. Ma:
- ciemny interfejs z siatką i poświatami,
- karty typów,
- Q-Score, prawdopodobieństwo, kurs i Edge,
- obsługę live,
- kalendarz,
- statystyki,
- mobilny dolny pasek nawigacji,
- logowanie przez Telegram,
- komunikat 18+.

Największym problemem nie jest brak funkcji, ale brak pełnej spójności marki i kilka elementów, które mogą zmniejszać zaufanie użytkownika.

## Ocena robocza

| Obszar | Ocena obecna | Komentarz |
|---|---:|---|
| Ogólna jakość MVP | 7/10 | Bardzo solidna baza |
| Czytelność strony głównej | 7/10 | Dobra, ale część treści się powtarza |
| Identyfikacja wizualna | 5/10 | Tymczasowe logo wilka wymaga wymiany |
| Karty typów | 7/10 | Dobre, ale trzeba uporządkować Q-Score i Edge |
| Wiarygodność komunikacji | 5/10 | Topowe typy z ujemnym Edge wymagają decyzji |
| Wyniki live | 6/10 | Działają, ale odświeżanie jest zbyt wolne |
| Statystyki | 7/10 | Dobra baza wykresów i filtrów |
| Mobilność | 7/10 | Dobra baza, potrzebne dalsze testy |
| SEO / social sharing | 5/10 | Brakuje grafik Open Graph |
| Potencjał | 9/10 | Bardzo dobry kierunek |

---

# 2. Najważniejsze problemy do poprawy

## P0 — krytyczne

1. Zastąpić generyczne logo wilka docelowym sygnetem ogara polskiego.
2. Ograniczyć sekcję topowych typów do dwóch kart.
3. Nie prezentować ujemnego `Edge` jako rekomendacji value bez wyjaśnienia.
4. Poprawić odmianę słowa `mecz`.
5. Ujednolicić czas lokalny użytkownika.
6. Uporządkować nazwy lig: flaga / kraj / pełna nazwa.
7. Przetłumaczyć surowe wartości `home` i `away`.
8. Usunąć wizualne dublowanie sekcji Mundialu i podglądu tych samych typów.
9. Przygotować Open Graph i favicon na podstawie nowego logo.

## P1 — wysoki priorytet

1. Odświeżać live co 10–15 s podczas meczu.
2. Pokazywać godzinę ostatniej aktualizacji.
3. Dodać tooltipy wyjaśniające:
   - Q-Score,
   - prawdopodobieństwo,
   - kurs,
   - Edge.
4. Przygotować dedykowane ikony rynków i statusów.
5. Podłączyć prawdziwe herby drużyn, gdy API je udostępnia.
6. Dodać ilustracje pustych stanów.
7. Przygotować banner Mundialu i grafikę Open Graph.

---

# 3. ETAP 1 — zakres do wdrożenia teraz

## 3.1. Wymiana logo

### Zastąpić:
- `components/wolf-logo.tsx`
- obecny `components/brand.tsx`
- `public/favicon.svg`

### Dodać:
- `components/ogar-logo.tsx`
- pliki z katalogu `public/brand/`
- nowy `public/favicon.svg`

### Wymagania:
- zachować ciemne tło,
- `--accent` pozostawić jako kolor cyjanowy,
- w nagłówku używać sygnetu w kwadratowym kontenerze,
- w kolejnych etapach wykorzystać układ poziomy w hero i grafikach social media.

---

## 3.2. Dwa topowe typy zamiast trzech

W `app/page.tsx`:
```ts
const topTips: Tip[] = byQ.slice(0, 2)
```

Docelowo rekomendowane jest filtrowanie dodatniego Edge:
```ts
const valueTips = byQ.filter((t) => t.edge > 0)
const topTips: Tip[] = valueTips.slice(0, 2)
```

Jeżeli lista jest pusta, wyświetlić uczciwy komunikat:
```text
Dziś brak rekomendacji value powyżej progu jakości.
Sprawdź pozostałe mecze do obserwacji.
```

Nie należy automatycznie nazywać typu z ujemnym Edge „topową rekomendacją”.

---

## 3.3. Prawidłowa odmiana liczby meczów

Dodać wspólną funkcję:
```ts
export function plMatches(n: number): string {
  if (n === 1) return "mecz"
  const last = n % 10
  const teen = n % 100
  return last >= 2 && last <= 4 && !(teen >= 12 && teen <= 14) ? "mecze" : "meczów"
}
```

Na landing page używać:
```tsx
{`${matchesToday} ${plMatches(matchesToday)} w analizie`}
```

---

## 3.4. Tłumaczenie `home` i `away`

W `lib/oracle-map.ts`, w funkcji `mapBetSide`:
```ts
if (low === "home") return "gospodarze"
if (low === "away") return "goście"
```

Dopuszczalne czytelniejsze warianty na karcie:
- `Over 1,5 gola — goście`
- `Goście strzelą powyżej 1,5 gola`
- `Fortaleza EC: powyżej 1,5 gola`

---

## 3.5. Nazwy lig

Dodać w `lib/leagues.ts`:
```ts
export function getLeagueDisplayName(code: string): string {
  const name = getLeagueName(code)
  const country = getLeagueCountry(code)
  return country ? `${country} — ${name}` : name
}
```

Następnie używać `getLeagueDisplayName()` w kartach i szczegółach meczu.

Preferowany zapis:
- `🇧🇷 Brazylia — Série B`
- `🇮🇹 Włochy — Serie B`
- `🇪🇸 Hiszpania — Segunda División`

Jeżeli kod ligi nie ma kraju, użyć samej czytelnej nazwy bez surowego kodu.

---

## 3.6. Czas lokalny użytkownika

W komponentach klientowych nie wymuszać `Europe/Warsaw`.

Zamiast:
```ts
timeZone: "Europe/Warsaw"
```

używać strefy urządzenia:
```ts
timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
```

albo pominąć właściwość `timeZone`, aby przeglądarka użyła ustawień lokalnych.

Pod godziną meczu można dodać drobny opis:
```text
czas lokalny
```

Backend może nadal używać czasu warszawskiego przy wyznaczaniu domyślnego dnia dla polskiej wersji serwisu.

---

## 3.7. Paleta marki

Ustalić jako domyślną:
```css
--bg: #070812;
--bg-soft: #0d0e1a;
--accent: #67e8f9;
--accent-strong: #22d3ee;
--on-accent: #070812;
--success: #34d399;
--warning: #fbbf24;
--danger: #fb7185;
```

Po wdrożeniu nowego logo przemyśleć usunięcie alternatywnego zielonego motywu `lupus`, ponieważ nie pasuje do zaakceptowanej identyfikacji. Kolory zielony, bursztynowy i czerwony powinny przede wszystkim oznaczać status.

---

# 4. Zalecany układ strony głównej po ETAPIE 1

1. Nagłówek z nowym logo ogara.
2. Hero:
   - hasło `Analiza, nie przeczucie.`,
   - CTA `Zobacz typy na dziś`,
   - CTA `Jak działa model`.
3. Jeden kompaktowy banner Mundialu.
4. Dwie topowe rekomendacje value.
5. Pasek statystyk:
   - skuteczność,
   - ROI,
   - rozliczone typy,
   - liczba lig,
   - ostatnia aktualizacja.
6. Kompaktowy podgląd pozostałych spotkań.
7. Jak działa model.
8. Telegram.
9. FAQ.
10. Komunikat 18+.

Nie powielać dużej sekcji Mundialu ani tych samych pełnych kart typów.

---

# 5. Docelowy zestaw grafik

## Logo
- sygnet ogara,
- uproszczony favicon,
- logo poziome,
- logo pionowe,
- wersja monochromatyczna biała,
- wersja monochromatyczna ciemna.

## Dedykowane ikony
### Nawigacja
- start,
- typy,
- statystyki,
- ligi,
- newsy,
- kupony,
- Telegram.

### Rynki
- BTTS,
- Over 1.5,
- Mix,
- Thriller.

### Metryki
- Q-Score,
- Edge,
- prawdopodobieństwo,
- kurs,
- AI,
- auto-weryfikacja,
- live.

### Statusy
- trafiony,
- nietrafiony,
- oczekuje,
- live,
- wymaga logowania,
- brak spotkań,
- aktualizacja danych,
- wysokie ryzyko.

## Bannery
- hero desktop,
- hero mobile,
- Mundial 2026 desktop,
- Mundial 2026 mobile,
- Telegram bot,
- Open Graph,
- typ dnia,
- wynik po meczu,
- raport tygodniowy.

## Puste stany
- brak typów,
- analiza trwa,
- brak statystyk,
- logowanie wymagane,
- problem API,
- newsy wkrótce,
- kupony wkrótce.

---

# 6. Elementy UI, które pozostać powinny dynamicznymi komponentami

Nie eksportować jako PNG:
- pierścień Q-Score,
- pasek pewności,
- badge live,
- wynik,
- status trafiony / nietrafiony,
- kolor Edge,
- KPI,
- miniwykresy,
- wykresy statystyczne.

---

# 7. Lista kontrolna dla Claude Code

## Wykonać na osobnej gałęzi
Proponowana nazwa:
```bash
git checkout -b lupus-bets-stage-1-brand
```

## Kolejność
1. Skopiować katalog `public/brand/`.
2. Nadpisać `public/favicon.svg`.
3. Dodać `components/ogar-logo.tsx`.
4. Nadpisać `components/brand.tsx`.
5. Usunąć import i użycie `WolfLogo`.
6. Ograniczyć `topTips` do maksymalnie dwóch.
7. Zastosować filtr dodatniego Edge dla sekcji rekomendacji.
8. Dodać prawidłową odmianę `mecz`.
9. Przetłumaczyć `home` / `away`.
10. Dodać `getLeagueDisplayName`.
11. Ujednolicić czas lokalny w komponentach klientowych.
12. Uruchomić:
```bash
npm run build
```
13. Sprawdzić stronę na desktopie i telefonie.
14. Wykonać commit:
```bash
git add .
git commit -m "Implement LUPUS BETS stage 1 branding and recommendation cleanup"
git push -u origin lupus-bets-stage-1-brand
```

---

# 8. Kryteria akceptacji ETAPU 1

- [ ] W nagłówku widoczny jest ogar polski zamiast wilka.
- [ ] Favicon wykorzystuje uproszczony sygnet ogara.
- [ ] Na stronie głównej są maksymalnie dwie rekomendacje.
- [ ] Ujemny Edge nie jest promowany jako rekomendacja value.
- [ ] `4 mecze`, a nie `4 meczów`.
- [ ] `away` nie pojawia się w polskim interfejsie.
- [ ] Liga jest czytelna i możliwie jednoznaczna.
- [ ] Godziny meczów odpowiadają strefie urządzenia.
- [ ] Build przechodzi poprawnie.
- [ ] Strona jest sprawdzona na iOS Safari.

---

# 9. Zadanie startowe dla Claude Code

Wdróż ETAP 1 zgodnie z tym dokumentem. Zacznij od utworzenia nowej gałęzi `lupus-bets-stage-1-brand`. Skopiuj gotowe pliki SVG i komponenty z paczki. Następnie popraw logikę topowych rekomendacji, odmianę liczby meczów, tłumaczenie `home` / `away`, czytelne nazwy lig i czas lokalny. Po każdej grupie zmian uruchom build. Nie wdrażaj jeszcze nowych bannerów ani ilustracji — zostaw je na ETAP 2 i ETAP 3.
