# Redesign landingu — podsumowanie

**Repo:** `mtkittles/nova-pulse` · **PR:** [#70](https://github.com/mtkittles/nova-pulse/pull/70)
**Branch:** `claude/determined-galileo-1Vsu7` · **Commit:** `ec7aaf9` · **Data:** 2026-08-04
**Status:** ✅ `next build` exit 0 · Vercel Preview **Ready** · zweryfikowane w Chromium

**Preview:** https://nova-pulse-git-claude-determined-gali-78b1a7-mtkittles-projects.vercel.app/?demo=1

---

## Nowy układ

| # | sekcja | komponent |
|---|---|---|
| 1 | sticky header + blur po scrollu | `landing/landing-header.tsx` |
| 2 | „Dziś w skrócie" — 4 liczby z count-upem | `landing/today-strip.tsx` |
| 3 | „Typy dnia" — karty + chipy filtrów | `landing/today-tips.tsx` |
| 4 | „Forma modelu" — AreaChart 30 dni | `landing/model-form-chart.tsx` |
| 5 | „Rozkład Q-Score" — histogram | `landing/q-distribution.tsx` |
| 6 | „Ostatnio rozliczone" — proof bar | `landing/recent-settled.tsx` |
| 7 | „Jak działa" + „Plany" (przeniesione niżej) | `landing-page.tsx` |
| 8 | stopka | `landing-page.tsx` |

Dodatkowo `components/mobile-tab-bar.tsx` — dolna nawigacja **wydzielona z `app-nav.tsx`**. Landing wcześniej w ogóle jej nie miał; duplikowanie kodu byłoby gorsze niż jeden wspólny pasek. Blur, `safe-area-inset`, tap targety 44 px. Zysk trafia też na pozostałe strony.

## Design system — bez zmian w tokenach

Graphite Night nietknięty (`--bg-0 #05070B`, `--cyan #58E6F5`, Space Grotesk/Inter). Płaskie karty, obramowania 1 px, zero ciężkich cieni.

**Gradient użyty w jednym miejscu** — pod linią wykresu formy, gdzie oddziela obszar nad/pod progiem 50%. Wszędzie indziej płasko.

## Animacje (150–200 ms)

| efekt | realizacja |
|---|---|
| count-up liczb | `ui/count-up.tsx` (IntersectionObserver, już istniał) |
| fade-in + translate-y sekcji | `ScrollReveal` (istniejący, dwukierunkowy) |
| hover kart: `-2px` + border cyan | `.lift` w `globals.css` |
| skeleton shimmer | `.shimmer` — placeholder wykresów przed montażem Rechartsa |

**`.lift` działa tylko przy `(hover: hover) and (pointer: fine)`.** Na dotyku hover przykleja się po tapnięciu — tam jest `:active` (scale 0.99). To był świadomy wybór, nie przeoczenie.

Shimmer dołożony tam, gdzie **faktycznie** jest opóźnienie: Recharts potrzebuje szerokości kontenera, więc przed montażem leci placeholder o docelowej wysokości (układ nie skacze). Reszta landingu przychodzi z SSR z danymi — nie ma tam czego ładować.

## Mobile

- `.safe-bottom` / `.safe-top` — notch i pasek gestów
- `.pb-tabbar` — zapas na dolną nawigację, treść nie chowa się pod paskiem
- `.tap` — min. 44×44 px (WCAG 2.5.5) na wszystkich celach dotyku
- karty pełnoszerokie, `px-4` na mobile
- chipy filtrów w poziomym scrollu (`.no-scrollbar`), nie zawijają się w ścianę

---

## Weryfikacja w prawdziwej przeglądarce

Playwright + Chromium na zbudowanej stronie (nie na oko):

| sprawdzenie | desktop 1440×900 | mobile 390×844 |
|---|---|---|
| wykresy narysowane (`svg.recharts-surface`) | 2 | 2 |
| shimmer po montażu | 0 | 0 |
| chipy filtrów | 13 | 13 |
| karty meczów | 6 | 6 |
| błędy JS / konsoli | brak | brak |

Interakcja: klik w chip ligi filtruje **6 → 2 karty**.

> 403 na herbach w logu to proxy sandboxa blokujące `media.api-sports.io` — `TeamBadge` schodzi na inicjały, zgodnie z projektem. Na Vercelu herby ładują się normalnie.

### Trzy defekty wyłapane dopiero na zrzutach

1. **Chipy lig pokazywały „POL" zamiast „Ekstraklasa".** Wołałem `getLeagueDisplayName(code)` po stronie klienta, a słownik nazw (`fetchedNames`) jest zasilany **server-side** — na kliencie kod spoza statycznej listy `LEAGUES` leciał przez `prettifyCode`. Etykieta idzie teraz z `tip.league`, rozwiniętego już przez adapter.
2. **Oś Y wykresu przycięta** — „85%" renderowało się jako „35%" przez `margin.left: -18`.
3. **Logo z ciemnym prostokątem** — `lupus-bets-horizontal.png` ma wypalone tło, które na `--bg-0` czytało się jako ramka. Header używa teraz lockupu `<Brand />`, tego samego co `AppNav` (spójność + brak edycji assetu).

### Fałszywy alarm

Pomiar wysokości strony pokazał 844 px (pusto), co wyglądało na zepsutą hydratację. To był serwer, który nie zdążył wstać w 10 s po świeżym buildzie. Po dodaniu czekania na gotowość: 7126 px (mobile) / 4518 px (desktop). Nic nie było zepsute — odnotowuję, bo to typowa pułapka przy automatycznych zrzutach.

---

## Decyzja o zakresie — wymaga Twojego potwierdzenia

„Pracuj **wyłącznie** w trybie demo" przeczytałem jako *rozwijaj i sprawdzaj na preview*, **nie** *ukryj redesign za flagą runtime*. Powody:

- punkt 7 zadania („istniejące sekcje zostają, ale niżej") opisuje docelowy landing, nie wariant demo;
- „nie ruszaj logiki produkcyjnej **poza samym layoutem/stylami**" wprost dopuszcza zmiany layoutu;
- dwa równoległe landingi = martwy kod do utrzymania.

Redesign jest więc **bezwarunkowy**, ale siedzi na niezmergowanym branchu — produkcja stoi nietknięta do momentu merge'a. Jeśli wolisz gating za `?demo=1`, to kilka linii w `app/page.tsx`.

## Zmiany w logice danych

Jedna: `app/page.tsx` woła dodatkowo `getTipsHistory(12)` — zasila sekcję „Ostatnio rozliczone". To wpięcie istniejącej funkcji, nie nowa logika. Fetch z Oracle nietknięty.

## Statystyki

**11 plików**, +1127 / −484. `landing-page.tsx` skurczył się z 531 do ~350 linii (logika przeniesiona do komponentów sekcji).

## Do sprawdzenia w preview

1. Scroll — blur headera po ~12 px, count-up przy wejściu paska w viewport.
2. Chipy: klik w ligę i rynek, licznik przy każdym chipie.
3. Karta z >3 rynkami → „+N więcej".
4. Mobile: dolny tab bar, brak treści pod paskiem, chipy w poziomym scrollu.
5. Sierota — wyszarzona karta z inicjałami zamiast herbu.
