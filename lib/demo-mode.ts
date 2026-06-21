// === Tryb AUDYTOWY / DEMO — TYLKO po stronie Next.js, zero zmian na Oracle/bocie ===
// Włączany flagą NEXT_PUBLIC_DEMO_MODE=true (scope Preview w Vercel).
// Domyślnie WYŁĄCZONY → produkcja działa normalnie.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

// Dwie ROZDZIELNE flagi (P0-2): premium ≠ admin.
// PREMIUM: odblokowuje treści premium dla testera. Domyślnie WŁĄCZONE w demo
//   (wyłącz ustawiając NEXT_PUBLIC_DEMO_UNLOCK_PREMIUM=false). NEXT_PUBLIC_,
//   bo gating treści premium dzieje się też po stronie klienta (np. TipCard).
export const DEMO_UNLOCK_PREMIUM = DEMO_MODE && process.env.NEXT_PUBLIC_DEMO_UNLOCK_PREMIUM !== "false"

// ADMIN: panel/akcje admina. Domyślnie WYŁĄCZONE — tester NIE jest adminem.
//   Włączane wyłącznie serwerowym DEMO_UNLOCK_ADMIN=true (BEZ NEXT_PUBLIC_,
//   żeby uprawnienia admina nigdy nie wyciekały do bundla klienta).
export const DEMO_UNLOCK_ADMIN = DEMO_MODE && process.env.DEMO_UNLOCK_ADMIN === "true"

// Syntetyczny użytkownik demo — przechodzi bramki `if (!session) redirect("/login")`.
export const DEMO_USER = {
  id: "demo_user",
  telegram_id: "0000000000",
  first_name: "Demo Tester",
  username: "demo_tester",
}
