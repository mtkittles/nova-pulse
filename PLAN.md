# PLAN — Nova-Pulse (web panel dla Lupus Bot)

> Roadmapa wdrożenia strony jako web-interfejsu dla bota typującego piłkę nożną.
> Status: **W TRAKCIE** — Etapy 1–3 zrobione (migracja Next.js + panel „Dzisiejsze
> typy" na mocku). Następne: endpoint na Oracle, logowanie (Etap 4), wykresy.

## Kontekst

- **Lupus Bot** — bot Telegram (`@lupus_bet_bot`) do predykcji piłkarskich: BTTS,
  Over 1.5, tryb Mix, Thriller (3:2/2:3). Działa produkcyjnie na **Oracle VPS**
  (`/home/ubuntu/betting-predictor`), baza `data/betting.db` (SQLite).
- **Nova-Pulse** — ta strona. Cel: drugi interfejs nad tym samym silnikiem/bazą.
  Architektura: „jeden mózg (silnik + baza), dwa interfejsy (Telegram + web)".
- Repo bota i endpoint API powstają **na Oracle** (osobna sesja) — nie tutaj.

## Zasady architektury (z głównego CLAUDE.md bota)

1. Oracle **nie jest wystawiony do przeglądarki**. Strona woła API **server-side**,
   za **Cloudflare Tunnel + klucz API**.
2. **Serwuj policzone typy, nie licz na żądanie** — strona tylko czyta gotowe
   rekordy z `bot_predictions`, nigdy nie uruchamia silnika.
3. **API publiczne i bot to OSOBNE procesy** — API nie może crashować bota.
4. **Sekrety nigdy w przeglądarce ani w gicie** — tylko zmienne env server-side.

## Decyzja: frontend = Next.js (App Router)

Powód: 3 z 3 wymagań potrzebują warstwy serwerowej (ukryty klucz API,
weryfikacja Telegram Login z tokenu bota, JWT/hash haseł). Next.js daje front
+ serwer w jednym repo i jeden deploy. Obecny landing (Vite, jeden `App.tsx`
+ Tailwind 4 + framer-motion) przenosimy 1:1, dokładamy routing i `app/api`.

## MVP — „Dzisiejsze typy"

### Przepływ danych

```
Przeglądarka → Next.js (Server Component / Route Handler, + API key)
            → Cloudflare Tunnel → Oracle /public-api/tips/today
            → czyta bot_predictions (policzone wcześniej) → JSON → strona
```

Przeglądarka nigdy nie widzi klucza API ani adresu Oracle.

### Kontrakt API (do zbudowania po stronie bota na Oracle)

`GET /public-api/tips/today`:

```jsonc
{
  "date": "2026-06-03",
  "tips": [
    {
      "event_id": 12345,
      "league": "Premier League",
      "home": "Arsenal", "away": "Chelsea",
      "kickoff_utc": "2026-06-03T19:00:00Z",
      "bet_type": "BTTS",        // BTTS | OVER_1_5 | MIX | THRILLER
      "bet_side": "YES",
      "model_prob": 0.71,
      "odds": 1.65,
      "edge": 0.08,
      "q_score": 82,
      "actual_result": null      // NULL przed meczem, 1/0 po (live_tracker)
    }
  ]
}
```

Źródło pól: tabela `bot_predictions` (auto-weryfikowana przez `live_tracker`).

## Etapy (wszystko w repo nova-pulse)

1. ✅ **Migracja na Next.js** — landing 1:1, routing `/`, `/login`, `/dashboard`.
   Komponenty z framer-motion oznaczone `"use client"`.
2. ✅ **Warstwa danych** — Route Handler `app/api/tips/today` + serwerowy
   `lib/tips.ts` jako punkt dostępu. Start na **mocku** zgodnym z kontraktem.
3. ✅ **UI „Dzisiejsze typy"** — karty w stylu premium (ciemny motyw, glass),
   badge rynku, Q-Score, filtr rynku, sort po Q-Score.
4. ⏳ **Logowanie (Telegram + email/JWT)** — `/login` na razie UI placeholder.
5. ⏳ **Podłączenie realnego API** — gdy endpoint na Oracle gotowy: w `lib/tips.ts`
   mock → fetch przez Cloudflare Tunnel (kod proxy już przygotowany w komentarzu).

## Szczegóły UI (zatwierdzone)

Karta typu pokazuje:
- Liga + godzina lokalna, `Gospodarz vs Gość`
- Badge rynku: `BTTS` / `Over 1.5` / `Mix` (różne kolory)
- **Q-Score 0–100** jako pasek/kółko: <50 czerwony, 50–75 żółty, >75 zielony
- Prawdopodobieństwo modelu (%) + kurs + edge (ze znakiem)
- Po meczu: znacznik trafione/pudło, gdy `actual_result` ≠ null

Sortowanie domyślne: **Q-Score malejąco**. Filtr po rynku (BTTS / O1.5 / Mix).
**Thriller ukryty w MVP.**

## Logowanie (zatwierdzone)

- JWT w **httpOnly cookie**, ważność **7 dni**, biblioteka `jose`.
- Hash haseł: **argon2**.
- Telegram Login Widget → `app/api/auth/telegram` weryfikuje HMAC z tokenu bota,
  wystawia JWT.
- Email + hasło → rejestracja/logowanie → JWT.
- Trasa `/dashboard` chroniona przez middleware Next.js.

## Konfiguracja (env, tylko server-side)

- `ORACLE_API_URL` — adres endpointu przez Cloudflare Tunnel
- `ORACLE_API_KEY` — klucz do API bota
- `JWT_SECRET` — podpis tokenów
- `TELEGRAM_BOT_TOKEN` — do weryfikacji Telegram Login

## Poza zakresem tej sesji (robione na Oracle)

- ETAP 0: bot → prywatne repo GitHub (`gh repo create lupus-bot --private`).
- Endpoint `/public-api/tips/today` + Cloudflare Tunnel + klucz API.

## Następna sesja — od czego zacząć

1. Migracja na Next.js (Etap 1) z zachowaniem obecnego wyglądu.
2. Route Handler `app/api/tips/today` na mocku (Etap 2).
3. UI „Dzisiejsze typy" (Etap 3).
