# V2 Oracle Ready Audit

> Audyt gotowości warstwy web pod integrację z Oracle API.
> Zakres: tylko dokumentacja i konfiguracja dostępu do danych, bez zmian logiki aplikacji.

## Werdykt

**Frontend jest gotowy na V2 po stronie integracji z Oracle.**
Warstwa serwerowa, adaptery i fallbacki są już na miejscu. Do pełnej gotowości produkcyjnej brakuje głównie jednego, spójnego kontraktu środowiskowego oraz smoke testu na żywym Oracle.

## Status obszarów

| Obszar | Status | Dowód | Uwagi |
| --- | --- | --- | --- |
| Dostęp do Oracle tylko server-side | Ready | `lib/oracle.ts` | `server-only`, `X-API-Key`, brak ekspozycji w przeglądarce |
| Proxy API dla tipów | Ready | `app/api/tips/today/route.ts` | Route Handler pobiera dane po stronie serwera |
| Proxy API dla statystyk | Ready | `app/api/stats/route.ts` | Route Handler działa jako serwerowy punkt wejścia |
| Mapowanie kontraktu Oracle | Ready | `lib/oracle-map.ts` | Adapter toleruje obecne i starsze kształty JSON |
| Fallback na brak Oracle | Ready | `lib/tips.ts`, `lib/stats.ts` | Mock/empty response zamiast crasha |
| UI pod dane z Oracle | Ready | `app/typy`, `app/stats`, komponenty | Widoki konsumują API, nie bezpośrednio Oracle |
| Spójność dokumentacji | Partial | `CLAUDE.md`, `PLAN.md`, `docs/ORACLE_API.md` | Wymaga ujednolicenia opisu stanu i środowiska |

## Co jest już gotowe

1. Sekrety Oracle są traktowane jako server-side only.
2. Aplikacja ma serwerowy adapter z walidacją i normalizacją danych.
3. Brak konfiguracji Oracle nie blokuje podglądu strony.
4. UI i API są rozdzielone na czyste granice odpowiedzialności.

## Co nadal wymaga dopięcia

1. Jednoznaczny opis base URL Oracle i sposobu autoryzacji w dokumentacji.
2. Smoke test na żywym `/public-api/tips/today` i `/public-api/stats`.
3. Potwierdzenie, że produkcyjne env na hostingu zawierają poprawne `ORACLE_API_URL` i `ORACLE_API_KEY`.
4. Lepsza obserwowalność błędów niż sam `502` i `console.error`.

## Ryzyka

1. Rozjazd dokumentacji może wprowadzić złą konfigurację środowiska.
2. Zmiana kształtu JSON po stronie Oracle bez aktualizacji adaptera może ukryć błędy pod fallbackiem.
3. Brak monitoringu utrudnia odróżnienie problemu sieciowego od problemu kontraktu.

## Rekomendacja

Traktować repo jako **V2 Oracle Ready w warstwie aplikacji** i skupić kolejną sesję na:

1. Ujednoliceniu dokumentacji.
2. Weryfikacji produkcyjnego Oracle na żywych endpointach.
3. Ustabilizowaniu środowiska deploymentu.
