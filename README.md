# Nova-Pulse

Web-interfejs dla **Lupus Bot** — bota Telegram do predykcji piłkarskich
(BTTS, Over 1.5, Mix, Thriller). Strona to drugi interfejs nad tym samym
silnikiem i bazą: „jeden mózg (silnik + baza), dwa interfejsy (Telegram + web)".

Pełny plan: [`PLAN.md`](./PLAN.md). Kontekst dla Claude Code: [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **framer-motion** + **lucide-react**

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
  landing-page.tsx         # landing (client)
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

## Status

- ✅ Migracja na Next.js (App Router)
- ✅ Panel „Dzisiejsze typy" na danych testowych (mock)
- ✅ Statystyki skuteczności `/stats` — wykresy (win-rate, ROI, per rynek/liga, Q-Score)
- ⏳ Endpoint na Oracle + podłączenie realnych danych
- ⏳ Logowanie (Telegram + email/JWT) — Etap 4
