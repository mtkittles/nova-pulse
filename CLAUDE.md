# CLAUDE.md — Nova-Pulse (web)

> Kontekst dla Claude Code w repo strony. Pełna roadmapa: zobacz `PLAN.md`.
> Język pracy: polski. Raporty zwięzłe. Commit po każdym kroku.

## CO TO JEST

**Nova-Pulse** — web-interfejs dla **Lupus Bot** (bot Telegram `@lupus_bet_bot`
do predykcji piłkarskich: BTTS, Over 1.5, Mix, Thriller). Bot działa osobno na
Oracle VPS. Ta strona to drugi interfejs nad tym samym silnikiem i bazą:
„jeden mózg (silnik + baza), dwa interfejsy (Telegram + web)".

## STAN OBECNY

- Stack: **Vite + React 19 + TypeScript + Tailwind 4 + framer-motion + lucide-react**.
- Cała treść w `src/App.tsx` (landing page, ciemny motyw premium, po polsku).
- Brak routingu, backendu, logowania, wykresów.
- **Plan: migracja na Next.js (App Router)** — patrz `PLAN.md`.

## ZASADY KRYTYCZNE

1. Oracle **nie jest wystawiony do przeglądarki**. API wołamy **server-side**
   (Route Handler / Server Component), za Cloudflare Tunnel + klucz API.
2. **Sekrety tylko server-side, nigdy w przeglądarce ani w gicie**
   (`ORACLE_API_URL`, `ORACLE_API_KEY`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`).
3. **Strona nie liczy predykcji** — czyta gotowe rekordy z API bota
   (źródło: tabela `bot_predictions`).
4. Kod bota (`/home/ubuntu/betting-predictor`) i endpoint `/public-api/...`
   żyją na Oracle — **nie w tym repo i nie w tym środowisku**.

## ŚRODOWISKO

- Claude Code na webie = kontener tymczasowy. Co nie jest zacommitowane — ginie.
- Repo: `mtkittles/nova-pulse`. Branch roboczy: `claude/determined-galileo-1Vsu7`.
- GitHub przez MCP (brak `gh` CLI w tym środowisku).

## CZEGO NIE ROBIĆ

- ❌ Nie wystawiać klucza API / adresu Oracle do przeglądarki.
- ❌ Nie commitować sekretów.
- ❌ Nie liczyć predykcji na żądanie HTTP — tylko serwowanie gotowych typów.
- ❌ Nie raportować „gotowe" bez weryfikacji.
