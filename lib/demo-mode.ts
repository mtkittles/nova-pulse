// === Tryb AUDYTOWY (demo) — TYLKO po stronie Next.js, zero zmian na Oracle/bocie ===
// Włączany flagą środowiskową NEXT_PUBLIC_DEMO_MODE=true (ustawianą na branchu
// audytowym w Vercel). Domyślnie WYŁĄCZONY → produkcja działa normalnie.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

export const DEMO_USER = {
  id: "demo_user",
  telegram_id: "0000000000",
  first_name: "Tester",
  username: "demo_tester",
  tier: "premium" as const,
  is_admin: false,
}
