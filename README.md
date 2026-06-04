# LUPUS BETS

Web-interfejs (marka **LUPUS BETS**) dla **Lupus Bot** — bota Telegram do
predykcji piłkarskich (BTTS, Over 1.5, Mix, Thriller). Strona to drugi interfejs
nad tym samym silnikiem i bazą: „jeden mózg (silnik + baza), dwa interfejsy
(Telegram + web)".

Pełny plan: [`PLAN.md`](./PLAN.md). Kontekst dla Claude Code: [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **framer-motion** + **lucide-react** + **recharts**

## Motywy

Dwa motywy przełączane w nagłówku (zmienne CSS, zapis w `localStorage`):
- **Nova** — cyan + violet (domyślny)
- **Lupus** — granat + neon lime

Bez migotania: motyw ustawiany inline-skryptem przed pierwszym malowaniem.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build produkcyjny
npm start        # serwer produkcyjny
```

## Struktura

```
app/
  page.tsx                 # landing page
  dashboard/page.tsx       # panel „Dzisiejsze typy" (Server Component)
  stats/page.tsx           # statystyki skuteczności + KPI (Server Component)
  login/page.tsx           # logowanie (UI placeholder, Etap 4)
  api/tips/today/route.ts  # proxy server-side do typów
  api/stats/route.ts       # proxy server-side do agregatów skuteczności
components/
  landing-page.tsx         # strona główna LUPUS BETS (client, animacje)
  brand.tsx                # logo wilka + wordmark LUPUS BETS
  wolf-logo.tsx            # SVG logo (kolory z motywu)
  theme-toggle.tsx         # przełącznik motywu Nova/Lupus (client)
  faq.tsx                  # FAQ (accordion, client)
  tips-board.tsx           # lista typów + filtr rynku (client)
  tip-card.tsx             # karta typu z Q-Score
  stats-charts.tsx         # wykresy Recharts (client)
lib/
  types.ts                 # typy typów (kontrakt API)
  stats-types.ts           # typy statystyk (kontrakt API)
  tips.ts / stats.ts       # serwerowy dostęp do danych (mock → Oracle)
  mock-tips.ts / mock-stats.ts  # dane testowe
```

## Zasady bezpieczeństwa

- Oracle **nie jest wystawiony do przeglądarki** — dane wołamy server-side
  (`lib/tips.ts`), za Cloudflare Tunnel + klucz API.
- Sekrety tylko w `.env.local` (patrz `.env.example`), **nigdy w gicie**.
- Strona **nie liczy predykcji** — serwuje gotowe rekordy z `bot_predictions`.

## Logowanie (Telegram)

1. W **BotFather** ustaw domenę strony: `/setdomain` → domena produkcyjna (np. `lupus-bets.vercel.app`). Widget działa tylko na tej domenie.
2. W **Vercel → Settings → Environment Variables** ustaw (Production + Preview):
   - `TELEGRAM_BOT_TOKEN` — token bota (sekret)
   - `JWT_SECRET` — losowy sekret (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — nazwa bota bez `@` (domyślnie `lupus_bet_bot`)
3. Redeploy. Przepływ: widget → `/api/auth/telegram` (weryfikacja HMAC) → sesja JWT w httpOnly cookie → bramka `/stats` otwarta.

Bez logowania: dzisiejsze typy + KPI. Po zalogowaniu (free): pełne wykresy.

## Status

- ✅ Migracja na Next.js (App Router)
- ✅ Rebranding **LUPUS BETS** + logo wilka + system dwóch motywów
- ✅ Strona główna: hero, jak to działa, tryby, skuteczność, FAQ, 18+
- ✅ Panel „Dzisiejsze typy" na danych testowych (mock)
- ✅ Statystyki skuteczności `/stats` — wykresy (win-rate, ROI, per rynek/liga, Q-Score)
- ✅ Logowanie przez Telegram (JWT) + bramkowanie (gating) free
- ⏳ Endpoint na Oracle + podłączenie realnych danych
- ⏳ Email/hasło (po Telegramie)
