# PLAN — Nova-Pulse

> Roadmapa po audycie V2. Celem jest utrzymanie spójności dokumentacji i potwierdzenie gotowości Oracle na żywym środowisku.

## Status

**V2 Oracle Ready w warstwie aplikacji.**
Frontend, serwerowe proxy i adaptery są gotowe. Do domknięcia pozostaje produkcyjny smoke test i ujednolicenie dokumentacji.

## Co jest już wdrożone

1. Next.js App Router jako główny stack aplikacji.
2. Serwerowy dostęp do Oracle w `lib/oracle.ts`.
3. Adapter kontraktu Oracle w `lib/oracle-map.ts`.
4. Endpointy proxy: `app/api/tips/today` i `app/api/stats`.
5. Fallback na mock/empty response, gdy Oracle jest niedostępne.

## Co wymaga potwierdzenia

1. Żywy kontrakt `/public-api/tips/today`.
2. Żywy kontrakt `/public-api/stats`.
3. Poprawne wartości `ORACLE_API_URL` i `ORACLE_API_KEY` w środowisku produkcyjnym.
4. Spójność między `CLAUDE.md`, `docs/ORACLE_API.md` i `docs/V2_ORACLE_READY_AUDIT.md`.

## Zasady architektury

1. Oracle nigdy nie trafia bezpośrednio do przeglądarki.
2. Strona czyta gotowe rekordy, nie liczy predykcji.
3. Sekrety pozostają tylko po stronie serwera.
4. Zmiany kontraktu Oracle zawsze najpierw trafiają do dokumentacji.

## Następna sesja

1. Wykonać smoke test na żywym Oracle.
2. Ujednolicić opisy środowiska i kontraktu.
3. Dopiero potem ruszać kolejne zmiany w UI lub danych, jeśli testy wykażą rozjazd.
