// === Flagi trybu danych demo ===
// Moduł CELOWO bez `server-only` i bez `next/headers` — importuje go także
// middleware (runtime edge). Odczyt ciasteczka żyje w `lib/demo-source.ts`.

export const DEMO_COOKIE = "lb_demo"

/** Wymusza dane demo dla WSZYSTKICH żądań (ustaw w scope Preview na Vercel). */
export const DEMO_DATA_FORCED = process.env.DEMO_DATA === "true"

/**
 * Czy `?demo=1` jest honorowane.
 *
 * Domyślnie: wszędzie POZA produkcją. Na produkcji trzeba jawnie
 * `ALLOW_DEMO_PARAM=true` — inaczej ktokolwiek mógłby dopisać `?demo=1` do
 * linku żywego serwisu i zobaczyć zmyślone typy jako prawdziwe.
 */
export const DEMO_PARAM_ALLOWED =
  process.env.ALLOW_DEMO_PARAM === "true" ||
  (process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV !== "production"
    : process.env.NODE_ENV !== "production")
