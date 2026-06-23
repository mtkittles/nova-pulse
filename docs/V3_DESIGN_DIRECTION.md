# Lupus Bets v3 Design Direction

## 1. Nazwa kierunku wizualnego

**Lupus Signal OS**

Kierunek v3 traktuje Lupus Bets jak mobilny system operacyjny do analizy sygnałów piłkarskich: szybki, ciemny, precyzyjny, spokojny i wiarygodny. Strona ma wyglądać jak narzędzie analityczne premium, nie jak serwis bukmacherski ani kasyno.

## 2. Brand i ton

Brand ma komunikować **inteligencję sportową, transparentność i kontrolę ryzyka**. Lupus nie sprzedaje obietnicy wygranej; pokazuje policzone sygnały, jakość modelu, status danych i historię rozliczeń.

Ton copy:

- Krótki, konkretny, technicznie wiarygodny.
- „Model, dane, kalibracja, ryzyko” zamiast „pewniak, jackpot, okazja”.
- Mocne rozróżnienie między danymi live, mock/demo i błędem źródła.
- Odpowiedzialna narracja: predykcja statystyczna, nie gwarancja.
- Polski język produktowy, ale z akceptowalnymi etykietami systemowymi typu `live`, `mock`, `Q-Score`, `ROI`.

Podstawowa obietnica produktu:

> Analityczny interfejs nad silnikiem Lupus Bot: typy, jakość sygnału, live status i rozliczona skuteczność w jednym mobile-first dashboardzie.

## 3. Paleta kolorów

Paleta ma pozostać dark-first, ale mniej neonowa i bardziej finansowo-analityczna. Akcenty powinny wzmacniać hierarchię danych, nie dominować nad treścią.

Kolory bazowe:

- `Ink 950` `#05070D` - główne tło aplikacji.
- `Ink 900` `#080B14` - tło sekcji i shell.
- `Slate 850` `#101522` - powierzchnie kart.
- `Slate 760` `#182033` - podniesione powierzchnie, nav, selecty.
- `Line Soft` `rgba(255,255,255,0.08)` - podstawowy border.
- `Line Strong` `rgba(255,255,255,0.14)` - aktywne karty, hover, ważne panele.

Kolory tekstu:

- `Text Primary` `#F8FAFC` - nagłówki i najważniejsze liczby.
- `Text Secondary` `rgba(248,250,252,0.72)` - opisy.
- `Text Muted` `rgba(248,250,252,0.48)` - etykiety, pomocnicze metadane.
- `Text Faint` `rgba(248,250,252,0.32)` - najmniej ważne stany.

Akcenty produktowe:

- `Signal Cyan` `#5EEAD4` - główny akcent v3, CTA, aktywne stany, Q-Score high.
- `Intelligence Blue` `#60A5FA` - wykresy, linki wtórne, informacje.
- `Model Violet` `#A78BFA` - drugi wymiar wykresu, np. ROI lub model probability.
- `Trust Emerald` `#34D399` - sukces, wygrane, status live poprawny.
- `Risk Amber` `#FBBF24` - mock/demo, warning, ryzyko średnie.
- `Loss Rose` `#FB7185` - błąd, przegrana, ryzyko wysokie.

Zasady użycia:

- Jeden kolor akcentu dominujący na ekran. Drugi akcent tylko do porównania danych.
- Mock/demo zawsze amber, error zawsze rose, live zawsze emerald lub cyan zależnie od kontekstu.
- Nie używać czerwieni jako dekoracji; tylko negatywne stany, wysokie ryzyko lub błąd.
- Gradienty powinny być ciemne i subtelne, z opacity niskim. Unikać pełnych neonowych plam na mobile.

## 4. Typografia i spacing

Typografia:

- Bazowo można zostać przy Inter, ale v3 powinno używać bardziej wyraźnej hierarchii przez rozmiar, wagę i tracking.
- Nagłówki hero: `font-semibold`, mocny negative tracking, krótkie linie.
- Nagłówki aplikacji: 32-40 px na mobile, 44-56 px na desktop.
- KPI i liczby: tabular, duże, z czytelną jednostką. Tam gdzie możliwe używać `tabular-nums`.
- Etykiety: 11-13 px, uppercase tylko dla statusów i metadanych, nie dla całego UI.
- Treści opisowe: 14-16 px, line-height 1.55-1.75.

Spacing:

- Mobile bazuje na siatce 4 px, ale główne odstępy: 12, 16, 20, 24, 32.
- Desktop: 24, 32, 40, 56, 72.
- Karty na mobile nie powinny mieć zbyt dużych marginesów bocznych; preferowane `px-4` albo `px-5`, nie wszędzie `px-6`.
- Główne sekcje landing page: mniej pionowego rozciągania na mobile, więcej gęstości danych po pierwszym ekranie.
- Bottom nav wymaga stałego safe-area paddingu oraz dolnego paddingu treści minimum `calc(nav + 24px + env(safe-area-inset-bottom))`.

## 5. Karty, glass, gradienty i cienie

Karty v3 mają być bardziej „instrument panel” niż „szklane kafelki”.

Zasady kart:

- Radius bazowy: 20-28 px, nie każda karta musi mieć 32+ px.
- Border zawsze subtelny: `1px solid rgba(255,255,255,0.08-0.14)`.
- Tło kart: ciemne, lekko półprzezroczyste, ale z wystarczającym kontrastem do tekstu.
- Cień ma dawać głębię tylko dużym panelom. Małe karty KPI mogą mieć border + background bez dużego shadow.
- Najważniejsza karta na ekranie może mieć gradient edge albo glow, ale nie wszystkie naraz.
- Hover desktop: lekki lift maksymalnie 2-4 px, border jaśniejszy, bez skoku layoutu.
- Mobile: hover nie jest głównym stanem; priorytet ma tap target, czytelność i scroll performance.

Glass i gradienty:

- Glass traktować jako warstwę, nie styl dla każdego elementu.
- Tło globalne: ciemny radial gradient + delikatna siatka lub noise, ale na mobile bez pływających okręgów nachodzących na content.
- Gradienty akcentowe powinny prowadzić wzrok: hero, aktywna karta, ważny wykres.
- Nie używać jaskrawych glowów za tekstem.

Cienie:

- Duże panele: `0 24px 80px rgba(0,0,0,0.28)`.
- Małe karty: brak albo `0 12px 32px rgba(0,0,0,0.18)`.
- Tooltipy: jasny albo bardzo ciemny kontrastowy panel, zawsze z czytelnym tekstem.

## 6. Animacje

Animacje mają wzmacniać zaufanie i płynność, nie rozpraszać.

Zasady:

- Hero może mieć jeden spokojny reveal i jedną subtelną animację danych.
- Karty i listy: stagger maksymalnie 40-80 ms, bez długiego oczekiwania na treść.
- Wykresy: krótkie wejście osi/serii, ale dane muszą być czytelne natychmiast po załadowaniu.
- Bottom nav: aktywny stan może mieć micro transition koloru lub małego indicatora.
- Loading: skeletony powinny odzwierciedlać realny layout, bez intensywnego shimmeru.
- Respektować `prefers-reduced-motion`.
- Nie animować dużych blur/glow warstw na mobile.

## 7. Nowy układ landing page

Landing v3 powinien być bardziej produktowy i mniej marketingowy. Cel: w 10 sekund pokazać co robi Lupus, skąd są dane i dlaczego można im ufać.

Proponowana struktura:

1. **Top nav compact**: Brand, linki, CTA `Otwórz panel`; na mobile hamburger lub prosty sheet.
2. **Hero: Signal Dashboard**: po lewej krótkie hasło, po prawej realistyczny preview panelu typów/statystyk.
3. **Trust strip**: status danych, auto-weryfikacja, liczba rozliczonych typów, Oracle/server-side note.
4. **How it works**: trzy kroki: model liczy, bot/API publikuje, wyniki są rozliczane.
5. **Product modes**: BTTS, Over 1.5, Mix, Thriller jako `wkrótce` lub wysoki risk, bez kasynowego języka.
6. **Analytics preview**: mini wykres skuteczności/ROI + Q-Score calibration preview.
7. **Mobile app preview**: pokaz realnego mobile flow: wybór daty, filtry, karta typu, wejście w mecz.
8. **Responsible use**: krótki, widoczny panel 18+ i risk disclosure.
9. **FAQ**: mniej pytań, bardziej konkretne odpowiedzi o danych, logowaniu, mock/demo, rozliczeniach.

Hero copy kierunkowe:

- H1: `Football signals. Verified by data.` albo po polsku: `Typy piłkarskie z warstwą analityczną.`
- Sub: `Q-Score, edge, kurs, status meczu i rozliczona skuteczność w jednym panelu.`
- CTA primary: `Zobacz typy`
- CTA secondary: `Sprawdź statystyki`

Ważne: landing nie może obiecywać zysków. KPI mają być opisane jako rozliczone dane lub demo, zależnie od źródła.

## 8. Nowy układ /typy

`/typy` ma stać się głównym mobile-first feedem sygnałów.

Proponowany układ mobile:

1. **Compact header**: tytuł `Typy`, data, status źródła w jednej zwartej linii/pill.
2. **Date rail**: zamiast pełnego kalendarza jako pierwszy element na mobile, poziomy rail najbliższych dni z markerem dostępności. Pełny kalendarz może być w collapsible panelu lub sheet.
3. **Filter chips**: rynki jako poziomo scrollowane chipsy. Thriller disabled/wkrótce, nie aktywny filtr MVP.
4. **Filter sheet**: liga, sortowanie, min Q-Score w dolnym sheet lub compact toolbar. Obecne selecty są funkcjonalne, ale v3 powinno lepiej działać kciukiem.
5. **Summary row**: liczba widocznych typów, aktywny sort, szybki reset filtrów.
6. **Tip cards feed**: karty z mocniejszą hierarchią: liga/czas, matchup, rynek, Q-Score, edge, kurs, status meczu.
7. **Locked state**: dla anonimów karta nadal pokazuje mecz i status, ale typ/kurs/Q-Score są przykryte jednym eleganckim panelem `Zaloguj, aby odblokować analizę`.
8. **Empty/error states**: pełne, spokojne panele z jasną akcją: wybierz najbliższą datę, resetuj filtry, spróbuj później.

Proponowany układ desktop:

- Lewa kolumna: kalendarz + źródło danych + filtry.
- Prawa kolumna: sticky mini toolbar + grid kart.
- Karty mogą mieć gęstszy układ niż mobile, ale bez utraty czytelności.

Karta typu v3:

- Top: liga, kickoff, status live/finished/scheduled.
- Main: `Home vs Away`, pod spodem rynek i bet side.
- Metrics: Q-Score jako duży ring/bar, probability, odds, edge.
- Footer: settlement/live score, CTA do szczegółów, lock overlay jeśli anonim.
- Badge kolorów zgodny z paletą, bez nadmiaru chipsów.

## 9. Nowy układ /stats

`/stats` ma wyglądać jak dashboard analityczny, nie tylko lista wykresów.

Proponowany układ mobile:

1. **Header + source status**: jasne `live/mock/error`, okres aktywny, krótkie wyjaśnienie.
2. **Period segmented control**: 7 dni, 30 dni, całość jako pełnoszeroki segment, łatwy do tapnięcia.
3. **KPI deck**: 2x2 + Q-Score albo poziomy carousel. Każda karta pokazuje wartość, delta/context, małą ikonę.
4. **Primary chart**: skuteczność i ROI w czasie jako pierwszy duży panel.
5. **Q-Score calibration**: drugi priorytet, bo tłumaczy jakość modelu.
6. **Market breakdown**: trafialność per rynek, z lepszymi legendami i kontrastowymi tooltipami.
7. **League breakdown**: na mobile może być collapsible albo top 5 + `pokaż więcej`.
8. **Settled tips**: zamiast szerokiej tabeli na mobile preferować listę rekordów; tabela może zostać desktop-only.

Proponowany układ desktop:

- Góra: header, period, source status, 5 KPI w jednym rzędzie.
- Następnie dashboard grid: primary timeline 2 kolumny, Q-Score + markets obok, leagues + settled tips niżej.
- Tooltipy: wysoki kontrast, zawsze readable, etykiety po polsku.

Zasady wykresów:

- Grid lines bardzo subtelne.
- Oś tekstowa czytelna na mobile; redukować liczbę ticków zamiast upychać.
- Kolory serii zgodne z semantyką, nie losowe.
- Legends krótkie i bez powtarzania tytułu.
- Brak danych: osobny empty panel, nie pusty wykres.

## 10. Zasady mobile-first

Mobile jest podstawowym doświadczeniem, desktop jest rozszerzeniem.

Zasady:

- Najważniejsze akcje są w zasięgu kciuka: bottom nav, filter sheet, CTA na kartach.
- Nie wymuszać poziomego scrolla poza kontrolowanymi railami/chipsami.
- Karty mają czytelny vertical rhythm i nie wymagają hover.
- Bottom nav nie może zasłaniać treści; każdy widok aplikacyjny ma safe-area bottom padding.
- Sticky elementy na mobile muszą być krótkie i nie zabierać więcej niż 15-18% wysokości ekranu.
- Statusy danych muszą być widoczne, ale zwarte. Nie ukrywać mock/demo w tooltipach ani stopce.
- Formularze i selecty powinny mieć minimum 44 px wysokości tap targetu.
- Wykresy na mobile mają mieć priorytet interpretacji nad ilością danych: mniej ticków, większe tooltipy, krótsze legendy.
- Large blur/glow layers powinny być ograniczone albo ukryte na mobile, aby nie przykrywać kart i nie obciążać renderowania.

## 11. Czego nie wolno robić

- Nie robić casino look: brak żetonów, jackpotów, złota, czerwono-czarnych gradientów, „pewniaków”.
- Nie używać języka gwarancji: `pewna wygrana`, `zarobek`, `100%`, `banker`.
- Nie ukrywać danych mock/demo jako realnych; status źródła musi zostać widoczny na `/typy`, `/stats` i preview/demo mode.
- Nie zmieniać kontraktu Oracle API, auth Telegram, preview/demo mode ani statusów `live/mock/error` w ramach redesignu UI.
- Nie mieszać semantyki kolorów: amber nie oznacza sukcesu, rose nie oznacza dekoracji.
- Nie przeładowywać UI neonami, blurami i animowanymi glowami.
- Nie robić dużego redesignu w jednym commicie; wdrażać etapami.
- Nie usuwać funkcji istniejących widoków: `/`, `/typy`, `/stats`, `/mecz/[id]`, `/ligi`, `/admin`.
- Nie pogarszać dostępności: kontrast, focus state, tap targets i reduced motion są wymagane.
- Nie wprowadzać klient-side sekretów ani logowania surowych payloadów.

## 12. Plan wdrożenia w 4 małych etapach

### Etap 1: Design tokens i shell

Cel: przygotować fundament v3 bez zmiany logiki danych.

Zakres:

- Uporządkować CSS variables dla palety v3.
- Dodać wspólne klasy/konwencje dla powierzchni, borderów, tekstu i statusów.
- Odświeżyć `AppShell`, `AppNav`, `Brand`, `ThemeToggle` w kierunku premium analytics.
- Poprawić bottom nav, safe-area, focus states i mobile shell.

Pliki:

- `app/globals.css`
- `components/app-shell.tsx`
- `components/app-nav.tsx`
- `components/brand.tsx`
- `components/theme-toggle.tsx`
- `components/wolf-logo.tsx` tylko jeśli konieczne optycznie, bez rebrandu logiki.

### Etap 2: Landing v3

Cel: przebudować stronę główną na produktowy, premium landing bez zmiany danych wejściowych.

Zakres:

- Nowy hero z realistycznym preview dashboardu.
- Trust strip i jaśniejsze wytłumaczenie modelu, rozliczeń i źródeł danych.
- Sekcja analytics preview z lepszą hierarchią.
- Odpowiedzialne komunikaty 18+ widoczne, ale nie dominujące.
- Zachować CTA do `/typy`, `/stats`, `/login` i Telegram.

Pliki:

- `components/landing-page.tsx`
- `components/faq.tsx` jeśli copy FAQ wymaga skrócenia.
- `components/brand.tsx` tylko jeśli Etap 1 nie objął finalnej wersji.

### Etap 3: Typy feed v3

Cel: przekształcić `/typy` w mobile-first feed sygnałów z lepszym filtrowaniem.

Zakres:

- Compact header i status źródła.
- Date rail/collapsible calendar na mobile, pełny kalendarz na desktop.
- Filter chips i opcjonalny filter sheet.
- Nowa hierarchia `TipCard`, w tym locked state i live/settlement badges.
- Zachować obecne filtry: date, market, league, min Q-Score, sort.
- Thriller pozostaje disabled/wkrótce, dopóki MVP tego wymaga.

Pliki:

- `components/typy-page.tsx`
- `components/tip-card.tsx`
- `components/calendar.tsx`
- `components/locked-section.tsx` jeśli wymaga spójnego stylu.

### Etap 4: Stats dashboard v3

Cel: nadać `/stats` rangę pełnego dashboardu analitycznego.

Zakres:

- Przebudować KPI deck i period control.
- Uporządkować dashboard grid mobile/desktop.
- Doprecyzować tooltipy, legendy, puste stany i Q-Score calibration.
- Zmienić settled tips na listę mobile + tabelę desktop, bez zmiany danych.
- Zachować statusy live/mock/error i locked state.

Pliki:

- `components/stats-view.tsx`
- `components/stats-charts.tsx`
- `components/settled-tips.tsx`
- `components/locked-section.tsx` jeśli wymaga wspólnego locked patternu.

## 13. Lista plików według etapów

Etap 1:

- `app/globals.css`
- `components/app-shell.tsx`
- `components/app-nav.tsx`
- `components/brand.tsx`
- `components/theme-toggle.tsx`
- `components/wolf-logo.tsx`

Etap 2:

- `components/landing-page.tsx`
- `components/faq.tsx`
- `components/brand.tsx`

Etap 3:

- `components/typy-page.tsx`
- `components/tip-card.tsx`
- `components/calendar.tsx`
- `components/locked-section.tsx`

Etap 4:

- `components/stats-view.tsx`
- `components/stats-charts.tsx`
- `components/settled-tips.tsx`
- `components/locked-section.tsx`

Pliki, których redesign UI nie powinien ruszać bez osobnego zadania:

- `lib/oracle.ts`
- `lib/oracle-map.ts`
- `lib/types.ts`
- `lib/stats-types.ts`
- route handlery API w `app/api/**`
- auth/login Telegram
- konfiguracja Vercel i pliki `.env*`

## Podsumowanie kierunku

Lupus Signal OS przesuwa Lupus Bets z efektownego dark landing page w stronę poważnej aplikacji analitycznej: mocna hierarchia danych, kontrolowane akcenty, jawne statusy źródeł, mobile-first feed typów i dashboard statystyk. Redesign powinien być wdrażany małymi etapami i nie może zmieniać funkcjonalności ani kontraktów danych.
